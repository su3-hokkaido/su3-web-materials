# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add tsdown, publint and attw; add `tsdown.config.ts`, `src/shared/all.ts` and the `build`
      script; verify the unbundled JavaScript and declarations (spike) and record the result
- [x] Add `scripts/lib/package-exports.ts` with tests, set the `package.json` fields (`exports`,
      `files`, `sideEffects`, `types`, `customElements`, `publishConfig`, remove `private`) and add
      the convention tests for the map and `all.ts`
- [x] Add `scripts/build-package-assets.ts` and the manifest path helper with tests (`tokens.css`,
      themes, `dist/custom-elements.json`) and wire them into `build`
- [x] Add `scripts/check-package.ts`, wire publint and attw into `check:package`, and extend `ci`
- [x] Add `scripts/new-product.ts`, the Makefile targets, and update the `/new-component` skill and
      `CLAUDE.md`
- [x] Add the consumer fixtures (plain HTML, Vite, React 19, Vue), `scripts/check-consumers.ts`,
      `check:consumers` and the Makefile target
- [x] Verify in Docker (`make build`, `make ci`, `make check-consumers`, a `make new-product` round
      trip with a throwaway product) and fix findings
- [x] Record the decisions in `docs/project_plan.md` sections 2, 9, 14, 15 and 17 and update
      `CLAUDE.md`
