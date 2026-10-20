# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Scaffold tooling: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.prettierrc`,
      `.prettierignore`, `tsconfig.json`, `.gitignore`; run `pnpm install`
- [x] Add `eslint.config.js` (dependency-direction zones kept; no React rules) and make
      `pnpm run lint` and `pnpm run typecheck` pass on an empty `src/`
- [x] Write `docs/design/design-language.md` (name, seed color, palette, shape, type, motion)
- [x] Add tokens under `src/shared/tokens/` (`ref`, `sys`; light, dark, reduced motion)
- [ ] Decorator spike: minimal Lit element with `static properties` and `declare` fields; verify
      tsc, Storybook, Vitest Browser Mode and the manifest analyzer; record the outcome
- [ ] Add `src/shared/behaviors/` form-associated mixin (`ElementInternals`, submit, reset)
- [ ] Implement `su3-button` (`button.ts`, `button.styles.ts`, `index.ts`) and export it from
      `src/shared/index.ts`
- [ ] Add `custom-elements-manifest.config.mjs` and the `analyze` script
- [ ] Configure Storybook (`.storybook/main.ts`, `preview.ts`, theme toolbar, manifest) and add
      `button.stories.ts` with a `Default` story and one story per variant and state
- [ ] Configure Vitest Browser Mode (`vitest.config.ts`) and install Chromium
- [ ] Write `button.test.ts` (variants, keyboard, click, disabled and soft-disabled, link mode,
      form submit and reset, events, parts)
- [ ] Port `src/conventions.test.ts` (Node and pnpm pins, unique titles, `Default` story)
- [ ] Add the `ci` script (format check, lint, typecheck, test, analyze, build-storybook) and make
      it pass
- [ ] Review with the `component-reviewer` agent and fix findings
- [ ] Record the decisions in `docs/project_plan.md` section 17 and update `CLAUDE.md` if any
      convention changed
