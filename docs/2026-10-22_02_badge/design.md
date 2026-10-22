# Badge

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. Card is done; Badge is
next.

## Requirements and non-goals

- `su3-badge`: a small status marker with four tones (`accent`, `subtle`, `danger`, `neutral`) and
  three kinds of content: slotted text, a numeric `count` (with `max`) and a `dot`.
- Non-goals: placing the badge over another element (authors position it), live-region announcements
  of changes, interaction.

## Technical approach and key decisions

1. A non-interactive element extending `LitElement`, like Divider and Card.
2. Tones only change private defaults, using color roles whose contrast pairs are already tested
   (`accent`/`on-accent`, `accent-subtle`/`on-accent-subtle`, `danger`/`on-danger`,
   `text-muted`/`surface-sunken`); no new sys tokens.
3. `count` shows `{max}+` when it exceeds `max` (default 99). A truncated count renders
   `role="img"` with the full count as its name, so assistive technology does not hear "99+".
4. A `dot` has no text, so it renders `role="img"` named by the host's `aria-label`.
5. Hooks `--su3-comp-badge-*`: `container-color`, `label-color`, `border-color`, `height`,
   `padding-inline`, `container-shape`, `font-size`, `dot-size`. In forced colors the border is
   `CanvasText` and a dot is filled with `CanvasText`, because backgrounds are replaced there.
6. New category `feedback` (Snackbar and Tooltip will join it): story title `Feedback/Badge`, clean
   URL `/{productId}/c/feedback/badge`.

## Affected files and directories

New `src/shared/components/feedback/badge/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports`, a new changeset, `docs/project_plan.md`,
`docs/design/design-language.md`, new VRT baselines. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- `feedback` as a new category rather than `containment`.
- A truncated count is exposed as an image with the full number instead of adding hidden text.
