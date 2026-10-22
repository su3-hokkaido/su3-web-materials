# Card

## Background

`docs/project_plan.md` section 14 item 9: the components after the MVP are added one task each,
Card first. Phases 1-8 are released (0.1.1 on npm).

## Requirements and non-goals

- `su3-card`: a surface that groups related content, with three variants (`elevated`, `filled`,
  `outlined`) and the slots `media`, `header`, the default slot and `actions`.
- Empty slots take no space.
- Non-goals: an interactive (link or button) card, selection, expandable content. Authors put a
  `su3-button` or a link in the `actions` slot.

## Technical approach and key decisions

1. A static container extending `LitElement`: no role, no focus and no form association, so it adds
   no tab stop and does not change the accessibility tree. Its content keeps its own semantics.
2. Variants only change private defaults; the public hooks are `--su3-comp-card-*`
   (`container-color`, `text-color`, `container-shape`, `border-color`, `border-width`, `elevation`, `padding`,
   `gap`). Only existing `--su3-sys-*` tokens are used, so no new tokens.
3. Slot presence is tracked with `slotchange` (states `hasMedia`, `hasHeader`, `hasBody`,
   `hasActions`), the same idea as the checkbox label; the wrappers are `hidden` while empty.
4. `forced-colors`: every variant gets a `CanvasText` border, because shadows are not drawn.
5. Story title `Containment/Card`; clean URL `/{productId}/c/containment/card`.

## Affected files and directories

New `src/shared/components/containment/card/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports` (`make sync-exports`), a new changeset,
`docs/project_plan.md` (sections 14 and 17), `docs/design/design-language.md`. New VRT baselines for
the card stories; no existing baseline changes. README and README_JA: unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Static card first; the interactive card is a separate later task (it needs a native element in
  the shadow root, a state layer and a focus ring).
- `filled` uses `surface-sunken` rather than a new token.
