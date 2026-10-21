# Phase 7: MVP components

## Background

`docs/project_plan.md` section 14 (Phase 7) completes the MVP: the foundation parts, IconButton,
Checkbox, Switch, TextField and Divider. Phase 1 deferred validity and reset/restore handling in
`FormAssociatedElement` until the first real form control; this phase adds them. The tokens, the
Storybook setup, Vitest Browser Mode, the derived `exports` and `all.ts`, the package and consumer
checks, the Docker VRT and the conventions tests from earlier phases must keep working unchanged.

## Requirements

- `su3-icon-button`, `su3-checkbox`, `su3-switch`, `su3-text-field` and `su3-divider`, each in its own
  directory with the five files of CLAUDE.md, a `Default` story, role-based Vitest Browser Mode tests,
  JSDoc with `@tagname`, tokens only, no decorators.
- Form controls participate in forms: `FormData`, required validation, reset, state restore,
  `<fieldset disabled>`, and the native validity API.
- Keyboard and screen reader behavior matches the native controls; axe reports no violations.
- Shared visual helpers (state layer, focus ring, touch target) exist once and the Button uses them
  without any pixel change.
- `all.ts`, the derived `exports`, the manifest, the package checks, the consumer checks and the VRT
  baselines cover the new components.

## Non-goals

README (Phase 8), the post-MVP components (Card, Select, Dialog, ...), framework wrappers, a
`textarea` variant, a date or number field.

## Technical approach and key decisions

### 1. Foundation parts are shared style modules (refines sections 3 and 14)

The plan called ripple, focus ring and elevation "public components in the foundation category".
Phase 1's design language uses state layers rather than ripples, so there is no ripple. A state
layer, a focus ring and a touch target are CSS that must act on a component's own box (`::before`,
`outline`, `::after`); separate custom elements would add a shadow root per control, complicate hit
testing and duplicate tokens. They are therefore shared `css` fragments in `src/shared/styles/`
(`state-layer.ts`, `focus-ring.ts`, `touch-target.ts`) built from tokens (the conventions test already
forbids literals in style files). Elevation stays a token plus the elevated variant's rules. The
Button is refactored onto the fragments; its existing VRT baselines are the proof that nothing
changed.

### 2. `FormAssociatedElement` additions

- The validity API over `ElementInternals`: `validity`, `validationMessage`, `willValidate`,
  `checkValidity()`, `reportValidity()`, `setCustomValidity(message)` and `labels`.
- A protected `setValidityState(flags, message, anchor)` that merges a custom message (a custom error
  wins), so subclasses only describe their own constraint.
- Hooks `resetFormState()` and `restoreFormState(state, mode)`, called by `formResetCallback` and
  `formStateRestoreCallback`; the base implementations do nothing.
- `accessibleName` (`aria-label` forwarding to the inner control) moves up from the Button.

### 3. `FormCheckableElement`

A base for Checkbox and Switch. `checked` follows the `checked` attribute (the initial state; a reset
returns to it, like a native checkbox, except that a later attribute change also updates the state),
`required` yields `valueMissing`, the form value is `value || 'on'` while checked and nothing
otherwise, the restore state is `checked` or `unchecked`. The accessible and keyboard element is a
native `<input type="checkbox">` inside the shadow root, covering the visual box so pointer and
focus land on it; the native `input` event crosses the shadow boundary, `change` is re-dispatched on
the host, and state is synchronized before host listeners run.

### 4. Components

- **IconButton** (`buttons/icon-button`): `variant` (standard, filled, tonal, outlined), `size`,
  optional `toggle` with `selected` (`aria-pressed`, `change` event, a `selected` slot for the
  alternate icon), the Button's form behavior (`type` defaults to `button`), `aria-label` forwarding.
- **Checkbox** (`selection/checkbox`): `checked`, `indeterminate` (a dash, `aria-checked="mixed"`),
  label in the default slot, `required`.
- **Switch** (`selection/switch`): the same base with `role="switch"` on the inner input.
- **TextField** (`inputs/text-field`): `variant` (outlined, filled), `label` (always visible above the
  input, no floating animation, to keep it accessible and calm), `supporting-text`, `error-text`,
  `type` (text, email, password, search, tel, url), `placeholder`, `required`, `readonly`,
  `minlength`, `maxlength`, `pattern`, `autocomplete`, `leading`/`trailing` slots. Validity delegates
  to the inner input; an error is shown after the first blur or when `error-text` is set. Reset
  restores the `value` attribute; restore applies the saved value.
- **Divider** (`containment/divider`): `role="separator"` with `aria-orientation`, `orientation`
  (horizontal, vertical), `inset`, `decorative` (presentation role).

### 5. Tokens

New system sizes `checkbox`, `switch-track-width`, `switch-track-height` and `switch-thumb`; component
hooks `--su3-comp-{name}-*` with `@cssprop` JSDoc. Colors reuse existing roles; the contrast tests
already cover them. The design language document lists the sizes.

### 6. Verification

Browser tests per component; the Button's baselines untouched after the refactor with only new
baselines added; every new baseline viewed in both themes and viewports; axe over every story in both
themes; package and consumer checks with the new entries; mutation checks on the base-class
behavior.

## Affected files and directories

- New: `src/shared/styles/`, `src/shared/behaviors/form-checkable.ts`, five component directories under
  `src/shared/components/{buttons,selection,inputs,containment}/`, tests.
- Modified: `src/shared/behaviors/{form-associated,form-submitter,index}.ts`, the Button files,
  `src/shared/tokens/sys.ts`, `src/shared/{all,index}.ts`, `package.json` `exports` (derived),
  `.changeset/initial-release.md`, `CLAUDE.md`, `docs/design/design-language.md`,
  `docs/project_plan.md` (sections 3, 14, 17), VRT baselines (added only).
- Story titles and clean URLs: `Buttons/Icon Button`, `Selection/Checkbox`, `Selection/Switch`,
  `Inputs/Text Field`, `Containment/Divider`. README and README_JA: unchanged (Phase 8).

## Provenance

Everything is written from scratch against native control behavior and WAI-ARIA practice. material-web
was inspected only for the idea that such controls exist; no code, structure beyond the common
public/internal split, token names or text is reused.

## Judgment calls

- Style fragments instead of foundation elements (decision 1).
- No floating label in the text field: simpler, accessible, no animation to test or baseline.
- The `checked` attribute is treated as the initial state, as the native attribute is, but also follows
  later attribute changes, which keeps declarative frameworks working.
