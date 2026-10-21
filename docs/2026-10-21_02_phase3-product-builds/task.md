# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add the `sample` and `acme` products (`index.ts`, `theme.css`), wire the product theme into
      `.storybook`, and share the contrast helper with a product theme accessibility test
- [x] Add `scripts/lib` (products, storybook-site, size limits) with unit tests and extend the Node
      Vitest project
- [x] Add `scripts/build-storybook-all.ts` and `portal/index.html`; add the `build-storybook:all`
      script and switch `ci` to it
- [ ] Add `deploy/cloudflare/_redirects` and `wrangler.jsonc`, install `wrangler`, and verify the
      placeholder expansion with `wrangler dev`
- [ ] Add `deploy/local/nginx.conf`, the Dockerfile `build` and `preview` stages, the compose
      `preview` service and the Makefile targets
- [ ] Extend `src/conventions.test.ts` (products, redirect rule parity, wrangler config, portal)
- [ ] Verify end to end (`make preview`, `make ci`, `make local-ci`, `wrangler dev`, size report) and
      fix findings
- [ ] Record the decisions in `docs/project_plan.md` sections 4, 14, 15 and 17 and update
      `CLAUDE.md`
