# Segmented button

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. Card and Badge are
done; the segmented button is next. It is the first component made of two cooperating elements.

## Requirements and non-goals

- `su3-segmented-button` (the group) and `su3-segment` (one option): a connected row where one
  segment (default) or several (`multiple`) can be selected, with three sizes.
- Form-associated group: `name`, `required`, reset and restore; `input` and `change` events.
- Non-goals: icon-plus-label layouts beyond what the default slot allows, vertical orientation,
  deselecting in single mode.

## Technical approach and key decisions

1. Two component directories (`buttons/segmented-button`, `buttons/segment`) because the
   conventions derive `su3-{name}` from the directory. The group's `index.ts` also imports the
   segment's, so `segmented-button.js` registers both.
2. Selection lives on the segments (`selected`); the group derives `value` (single) or `values`
   (multiple) from them and applies values set from outside. A value set before the segments exist
   wins over their `selected` attributes. Reset returns to the selection recorded at the first
   `slotchange`.
3. Accessibility: single mode is a `radiogroup` of native buttons with `role="radio"` and a roving
   tabindex (Arrow keys select, Home and End jump, disabled segments are skipped); multiple mode is a
   `group` of `aria-pressed` buttons that are all tab stops. The group is named with `aria-label`.
4. The group pushes `size`, `position` (first, middle, last, only), the selection mode, the roving
   tab stop and the group's disabled state to each segment, so the segment styles can round only the
   outer corners and share one border line. Click and keydown are handled once, on the group.
5. Form value: single mode submits `name=value`; multiple mode submits one entry per selected segment
   through a `FormData`. Nothing is submitted without a `name`. `required` is `valueMissing`.
6. Styles reuse the shared fragments (state layer, focus ring, touch target) like `su3-button`; hooks
   are `--su3-comp-segmented-button-*`, read by the segments.

## Affected files and directories

New `src/shared/components/buttons/segment/` and `.../segmented-button/` (ten files). Modified:
`src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports`, a new changeset,
`docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. No existing baseline
changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Two elements with the group doing the event handling, instead of a single element with an options
  array: declarative children are the natural authoring form and stay themable per segment.
- A single-select group never deselects (radio behavior); a segment cannot be cleared by clicking it.
- A segment added later does not change the form-reset snapshot.
