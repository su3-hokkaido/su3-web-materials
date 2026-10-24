# Data table

## Background

`docs/project_plan.md` section 14 item 9, the last of the components that remain after the MVP
(order: tooltip, top app bar, dialog, menu, select, date picker, time picker, data table). It is
built from three cooperating elements in the `containment` category, like the segmented button and
the navigation bar are built from a container and its items.

## Requirements and non-goals

- `su3-data-table` (the table), `su3-table-row` and `su3-table-cell`. A row with `header` holds the
  column headers; its cells become `columnheader`s.
- `columns` on the table is a CSS `grid-template-columns` value shared by every row, so the cells
  line up; without it the cells of a row share its width equally. `density` is `comfortable` (48px
  rows, default) or `compact` (40px). A cell has `align` (`start`, `center`, `end`) and keeps long
  text on one line with an ellipsis.
- Limiting the height (`--su3-comp-data-table-max-height`) or a table narrower than its columns
  makes it scroll; `sticky-header` keeps the header row visible while the rows scroll.
- Sorting: a header cell with `sortable` and a `sort` direction (`none`, `ascending`, `descending`)
  is a tab stop, shows an arrow and exposes `aria-sort`. Activating it (a click, Enter or Space)
  cycles none, ascending, descending, none, resets the other sortable headers and makes the table
  fire `sort` (`detail.cell`, `detail.direction`). The application orders the rows.
- Selecting: with `selectable` a click, Enter or Space on a body row toggles `selected` and makes the
  table fire `select` (`detail.row`, `detail.rows`); any number of rows can be selected, rows carry
  `aria-selected` and the table `aria-multiselectable`. The rows are one tab stop that moves with
  ArrowDown, ArrowUp, Home and End. A press on a control inside a row, including the inside of a
  component such as `su3-button`, is not a selection. A selectable table has the `grid` role and its
  cells `gridcell`, because `aria-multiselectable` is only valid on a grid.
- A table that scrolls (limited height, or fixed columns wider than it) is a tab stop while it does,
  so a keyboard user can scroll it.
- Non-goals: virtualisation, pagination, resizing or reordering columns, editing cells, tree rows,
  select-all, sorting the data itself.

## Technical approach and key decisions

1. Three component directories `containment/data-table`, `containment/table-row` and
   `containment/table-cell` (five files each); the table's `index.ts` imports the row's and the row's
   imports the cell's.
2. The table is itself the `table` role (`grid` while `selectable`): each element sets `role`
   (`table` or `grid`, `row`, `columnheader`, `cell` or `gridcell`), `aria-sort`, `aria-selected` and
   `aria-multiselectable` as attributes on its host, from `connectedCallback` on so they exist before
   the first render, and the roles are plain children of one another in the DOM tree: a name on the
   table is simply `aria-label` on the host. There is no shadow boundary between the roles. The
   header row marks its cells before they first render.
3. Layout is CSS grid: the table sets the private `--_columns` property on itself, each row is a
   grid that reads it (without it `grid-auto-flow: column` shares the width), and the density is the
   private `--_row-height` the cells read. No subgrid is needed because every row reads the same
   track list.
4. The header row makes its cells `columnheader`s (the row sets `header` on its cells when it changes
   or its slot does), so the author marks one thing, not every cell.
5. State lives on the elements: `sort` on header cells, `selected` on rows. The table is the one
   place that handles clicks and keys, by listening on the host, which also covers cells and rows
   added later. Rows carry `aria-selected` and cells their grid role only in a selectable table (the
   table asks them to update when `selectable` changes). The roving tab stop follows the rows: a row
   tells the table (an internal event) when `selected` or `header` changes, and the table keeps the
   stop of a row that has focus and only clears a `tabindex` it set itself. Whether a press was for a
   control inside the row is decided by walking the event's composed path up to the row, so the
   inside of a custom element is seen too.
6. Hooks `--su3-comp-data-table-*` (container color of the header row, body color, border color,
   shape, text color, header text color, selected color, maximum height, focus ring); no new sys
   tokens. Hover on a selectable row and on a sortable header uses the state hover opacity over the
   text color. Forced colors use `CanvasText` lines and a Highlight outline on selected rows; reduced
   motion removes the arrow transition.

## Affected files and directories

New `src/shared/components/containment/data-table/`, `.../table-row/` and `.../table-cell/`.
Modified: `src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports`, a new changeset,
`docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. Story titles
`Containment/Data Table`, `Containment/Table Row` and `Containment/Table Cell`; clean URLs
`/{productId}/c/containment/data-table`, `.../table-row` and `.../table-cell`. No existing baseline
changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- ARIA roles on the elements themselves instead of a native `<table>` in the shadow root, because
  the rows and cells are the application's light DOM children and cannot be moved into one.
- A selectable table is a `grid` (a plain `table` cannot be multiselectable); the keyboard model
  stays row based, with one tab stop over the rows, instead of the cell navigation of a full grid.
- A sortable header cell is itself the tab stop (with `aria-sort`), not a button inside it, which
  keeps one element per header; a screen reader announces the sort state, though not as a button.
- The application sorts and the table only reports: it cannot know the data.
- A click on a row selects it (no checkbox column in this version).
- One header row, identified by `header` on the row.
