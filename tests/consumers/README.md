# Consumer fixtures

Small projects that use the **packed** `su3-web-materials` tarball the way a consumer would
(docs/project_plan.md sections 9 and 15). `scripts/check-consumers.ts` packs the package, copies each
fixture to a temporary directory, installs the tarball with npm, builds it, serves the result and
checks it in Chromium: the element is defined, the button has the expected computed accent, nothing
fails to load, and (where a fixture has it) a click works and the types compile.

| Fixture      | Shows                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| `plain-html` | No build step: an import map, the built-in fallbacks (no `tokens.css`) and a theme file    |
| `vite`       | A TypeScript app: `tokens.css`, `button.js` and the element's types (`createElement`)      |
| `react`      | React 19: a custom element in JSX (typed through `IntrinsicElements`), a theme and a click |
| `vue`        | Vue 3: `isCustomElement`, `all.js` and a click                                             |

Run it with `make check-consumers` (needs network access and Chromium).
