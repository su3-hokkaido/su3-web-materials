# su3-web-materials

## 0.2.0

### Minor Changes

- a2025e7: Add the `<su3-date-picker>` Web Component: a form-associated date control with a calendar popup (or an inline calendar), keyboard navigation, min and max limits and locale-aware names. The calendar date helpers are exported.
- df35f0a: Add the `<su3-segmented-button>` and `<su3-segment>` Web Components: a connected row of options with single or multiple selection, keyboard navigation and form participation.
- 50decf8: Add the `<su3-navigation-bar>` and `<su3-navigation-item>` Web Components: a row of navigation destinations with an icon, a label, an optional badge and one selected item.
- 4a106fc: Add the `<su3-card>` Web Component: a surface with media, header, body and actions areas in elevated, filled and outlined variants.
- a2025e7: Add the `<su3-time-picker>` Web Component: a form-associated time control with lists of hours, minutes and AM or PM in a popup (or inline), min, max and step limits, and a 12 or 24-hour clock. The time helpers are exported.
- e3854cd: Add the `<su3-tooltip>` Web Component: a short text that describes its trigger, shown on hover and keyboard focus in the top layer, with four placements that flip and stay inside the viewport.
- 62a4f49: Add the `<su3-top-app-bar>` Web Component: the bar at the top of a page with a leading control, a title and trailing actions, in small, center and large variants, optionally sticky and raised while the page is scrolled.
- a2025e7: Add the `<su3-data-table>`, `<su3-table-row>` and `<su3-table-cell>` Web Components: a table with shared grid columns, sortable header cells that report the order the user asks for, selectable rows, compact density and a sticky header.
- 0e3d98f: Add the `<su3-menu>` and `<su3-menu-item>` Web Components: a popup list of commands that opens from a trigger, with keyboard navigation, typeahead, checkable items and a `select` event. `<su3-button>` and `<su3-icon-button>` now forward `aria-haspopup` and `aria-expanded` to their inner control.
- 64853b5: Add the `<su3-badge>` Web Component: a small status marker with text, a count (shown as `max+` above the maximum) or a dot, in accent, subtle, danger and neutral tones.
- 62a4f49: Add the `<su3-dialog>` Web Component: a modal dialog with a headline, scrolling content and actions, built on the native dialog element, with persistent, alert and fullscreen modes and a `close` event that reports why it closed.
- ed0d17d: Add the `<su3-snackbar>` Web Component: a transient message in the top layer with an optional action and close button, a self-closing timer that pauses on hover and focus, and a `close` event.
- a2025e7: Add the `<su3-select>` and `<su3-option>` Web Components: a form-associated single-choice select with a label, supporting text, validation and keyboard support. The popup helpers (`placePopup`, `PopupController`, `Typeahead`) are exported for building similar controls.
- 7d96456: Add the `<su3-navigation-rail>` Web Component: a vertical column of navigation destinations with an optional header slot and one selected item. The bar and the rail now share the `NavigationSelectionElement` base class, which is also exported.
- 2b2d105: Tooltip, appbar, select, dialog, menu, pickers, datatables
- 7d96456: Add the `<su3-navigation-drawer>` Web Component: a standard or modal panel of navigation destinations with a header slot, section headings and one selected item. `<su3-navigation-item>` gains a `layout` property (`stacked` or `inline`).

## 0.1.1

### Patch Changes

- 0cd349c: Just to update readme

## 0.1.0

### Minor Changes

- 992a6c7: Initial public release: the `<su3-button>`, `<su3-icon-button>`, `<su3-checkbox>`, `<su3-switch>`,
  `<su3-text-field>` and `<su3-divider>` Web Components (form-associated controls with validation, reset
  and restore), the design tokens with light and dark themes
  (`tokens.css`), the `sample` and `acme` product themes (`themes/*.css`) and the custom elements
  manifest.
