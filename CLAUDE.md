# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A catalog of real Web Components (Lit 3 + TypeScript, Shadow DOM, CSS custom property tokens)
inspired by the structure of material-web, shown in Storybook (`@storybook/web-components-vite`),
deployed per productId to Cloudflare Workers Static Assets and published to npm. The full
specification is `docs/project_plan.md`; read the relevant section before starting any task.

**material-web is a reference for structure and ideas only. Never copy its source, Sass, tokens,
docs text or assets, and never use the names "Material", `md-` or Google branding.** If copying
code from any other project seems necessary, stop and ask the user first.

## Top-level rules

- **Think exclusively in English, but respond to the user in Japanese.**
- Run independent tool calls **in parallel**, not sequentially.
- **No emojis** anywhere (code, comments, docs, commits, PRs).

## Language conventions

- **Everything written into the repository is English**: code, all comments (JSDoc, structural
  comments, and comments explaining the reasoning behind an implementation), documentation,
  per-task docs under `docs/`, commit messages and PR descriptions.
- The only exception is `README_JA.md`, which is Japanese and mirrors `README.md`.
- Conversation with the user in the Claude Code CLI is Japanese; that does not change the language
  of anything committed.

## Coding conventions

Summary of `docs/project_plan.md` §3, §4, §10 and §13:

- Layout: `src/shared/components/{category}/{name}/` and
  `src/products/{productId}/components/{category}/{name}/`. `{category}` is lower-case kebab-case,
  `{name}` is the lower-case kebab-case component name (`button`, `icon-button`).
- Each component directory contains exactly `{name}.ts`, `{name}.styles.ts`, `{name}.stories.ts`,
  `{name}.test.ts` and `index.ts`. Shared behavior goes in `src/shared/behaviors/` as base classes and
  tokens in `src/shared/tokens/`.
- Element tag `su3-{name}`, class `Su3{Name}`, `HTMLElementTagNameMap` declared. Each component
  class module `{name}.ts` has no side effects; the component's `index.ts` registers the element with
  `defineElement` and re-exports it; the package root `src/shared/index.ts` re-exports classes and
  types straight from `{name}.ts` (it registers nothing).
- Story `title` is `{Category}/{Component}` (no productId), and every story file exports a
  `Default` story, because clean URLs (`/{productId}/c/{category}/{component}`) point at
  `--default`. Titles must be unique across `shared` and each product.
- Styling: `css` tagged templates in `{name}.styles.ts`, scoped by Shadow DOM. No Tailwind, Sass,
  global selectors or `!important`. Never hardcode colors, sizes, radii, durations or fonts: use
  tokens. Tokens have three layers: `--su3-ref-*`, `--su3-sys-*`, `--su3-comp-{name}-*`; a
  component reads `--su3-comp-*` with a `var()` fallback chain to `--su3-sys-*` and a built-in
  default. Support `prefers-reduced-motion` and `forced-colors`.
- Document the public API with JSDoc so it reaches `custom-elements.json` and the Storybook docs:
  the description is the JSDoc body (not an `@description` tag, which the analyzer ignores), plus
  `@tagname su3-{name}` (required, because registration lives in `index.ts`), `@summary`, `@slot`,
  `@csspart`, `@cssprop` and `@fires`. Private and protected members are filtered out of the
  manifest by `custom-elements-manifest.config.mjs`.
- Prefer native semantics (`ElementInternals`, `delegatesFocus`, real `<button>`/`<input>` in the
  shadow root); form controls are form-associated. No a11y addon violations.
- Importing a module must not throw on the server and must not touch `document` or `customElements`
  (registration lives in the component's `index.ts`, through the guarded `defineElement`).
- Dependency direction: products may import `shared`; `shared` never imports products; products
  never import each other.
- Optional per-story VRT settings go in `parameters.vrt`:
  `{ disable?: boolean; viewports?: ('desktop' | 'mobile')[] }` (validated by `tests/vrt/stories.ts`).
- After a visual change or a new story, run `make vrt-update` and review the changed baselines in
  `tests/vrt/__screenshots__/`; delete the baselines of removed or renamed stories, and of stories or viewports you exclude
  with `parameters.vrt` (the orphan check cannot see those).
- No decorators (§2): use `static properties`, `declare`d fields initialised in the constructor,
  and a guarded `customElements.define`. Open decisions (tsdown output, preview mechanism) are
  listed in
  `docs/project_plan.md`; resolve them in the named phase and record them in §17.

## Component checklist

A new or changed component is done when:

- [ ] `{name}.ts`, `{name}.styles.ts`, `{name}.stories.ts`, `{name}.test.ts` and `index.ts` exist in
      `components/{category}/{name}/` (`/new-component` scaffolds them).
- [ ] Styles use tokens only (`--su3-comp-*` with fallbacks), live in Shadow DOM, and handle
      reduced motion and forced colors.
- [ ] The public API (properties, slots, parts, events, CSS properties) is documented with JSDoc.
- [ ] The story file has title `{Category}/{Component}` and a `Default` story; the a11y addon
      reports no violations.
- [ ] Vitest Browser Mode tests cover variants, keyboard and pointer behavior, states, form
      participation (if any) and events, using role-based queries.
- [ ] It is exported from the scope's `index.ts`, has its `package.json` `exports` entry, and imports
      follow the dependency direction.
- [ ] Code, comments and docs are in English, with no emojis; nothing is copied from material-web.
- [ ] `make vrt-update` ran and the changed baselines were reviewed.
- [ ] A changeset exists if the published package changes (`make changeset`).
- [ ] `make ci` passes.

## Documentation

- `README.md` (English) is the user-facing guide; `README_JA.md` mirrors it with the same headings,
  code blocks and links. Update both when commands, setup, the package API or the release flow
  change, then run the `readme-sync` agent.
- `docs/project_plan.md` is the specification: record decisions there (with a §17 entry), and
  per-task reasoning in `docs/{yyyy-mm-dd}_{NN}_{overview}/design.md`.

## Libraries and tooling

- To learn a library/framework API, **use the Context7 MCP** for current docs rather than memory —
  especially Lit, Storybook, Vitest (Browser Mode), Playwright, tsdown and Changesets, which move
  fast. For Cloudflare (Workers Static Assets, `_redirects`, wrangler), use the Cloudflare
  documentation search. Hosting is Workers Static Assets on the free plan; do not introduce paid
  services (no AWS Secrets Manager, no paid Cloudflare features).
- Until Phase 2 adds the Docker setup and the Makefile, run the pnpm scripts directly (`pnpm run ci`
  is the same check as `make ci` will be). Afterwards Docker is the default environment: run commands
  through `make` targets (`make help` lists them);
  `local-*` targets exist for running on the host.
- GitHub Actions (`.github/workflows/`, `docs/project_plan.md` §8): CI runs `pnpm run ci` and the
  Docker VRT on every PR. Pin any new action to a full commit SHA with a `# vX.Y.Z` comment (Dependabot
  updates them), keep `permissions` minimal, and keep Cloudflare specifics in `_deploy.yml` and
  `deploy/cloudflare/`.
- The Node.js major is in `.nvmrc`, `devEngines.runtime` and the Dockerfile `NODE_VERSION`; never
  add `engines` (it would be published). `src/conventions.test.ts` checks this.
- Hidden folders (e.g. `.tmp`) may be missed by directory listings; find them with `Glob`
  (`**/.tmp/**`) or `Bash` (`find`).

## Mutation policy (important)

**Claude must not run any command that changes data or remote/online state.** This covers:

- **git writes**: `add`, `commit`, `push`, `checkout`, `switch`, `branch`, `merge`, `reset`,
  `rebase`, `tag`, `remote`, `stash`. Read-only git (`status`, `diff`, `log`, `show`, `ls-files`)
  is fine.
- **Deploys and Cloudflare state**: `wrangler deploy`, `wrangler versions`, `wrangler delete`,
  `wrangler pages deploy`, `wrangler secret` / `wrangler pages secret`, `wrangler pages project`,
  `wrangler kv`, `wrangler r2`, `wrangler d1`, and mutating Cloudflare MCP tools (`*_create`, `*_delete`,
  `*_update`, `*_edit`, `d1_database_query`). Local `wrangler dev` and builds are allowed.
- **Publishing / releases**: `npm publish`, `pnpm publish`, `changeset publish` (in any form),
  `npm dist-tag`, `npm unpublish`, `npm deprecate`, `docker push`, `make deploy*`, `make release*`. `changeset` (creating a changeset file) and `changeset version`
  only change local files and are allowed.
- **Remote GitHub changes**: `gh pr create/merge/close/edit`, `gh release`, `gh api`, `gh secret`,
  `gh variable`, `gh workflow run`, `gh repo create/edit/delete`, `gh issue create/edit/close`,
  `gh label`.
- **Database CLIs**: `psql`, `mysql`, `mongosh`, `redis-cli`, `sqlite3`.

Most of the above are denied in `.claude/settings.json` (defense in depth). When such an action is
needed: **do not run it** — prepare the change and give the user the exact command(s) with a
one-line reason. Never commit automatically; present the diff and a proposed commit message, then
wait.

## Development workflow

Branches: `main` (production), `develop` (integration). Feature branches are named `feature/...`,
cut from `develop`, and merged back into `develop` via PR. Per-task docs live under
`docs/{yyyy-mm-dd}_{NN}_{overview}/` and are written in English.

1. Use the **`/new-task`** skill: enter plan mode, then write `design.md` (requirements/design).
2. Break the design into a `task.md` checklist, each item sized to one commit.
3. Give the user the branch commands to start (`git switch develop && git pull` then
   `git switch -c feature/...`).
4. Implement; **update `task.md`** as items complete. Use **`/new-component`** to add components.
5. If the change is user-visible in the published package, add a changeset (`make changeset`).
6. Run `make format` and `make ci` (`pnpm run format` and `pnpm run ci` until Phase 2) before
   handing back. If `README.md` or `README_JA.md` changed,
   run the `readme-sync` agent.
7. Have the `component-reviewer` subagent review the diff, then present it for the user to commit.

## Subagents and skills

- **`component-reviewer`** (agent): reviews diffs against the coding conventions above (tokens and
  naming, Shadow DOM styling, component layout and exports, story naming, dependency direction, a11y,
  language). Run before every handoff.
- **`readme-sync`** (agent): keeps `README.md` and `README_JA.md` structurally identical.
- **`/new-task`** (skill): scaffolds `design.md` + `task.md` for a new unit of work.
- **`/new-component`** (skill): scaffolds a component directory (component, story, test, index)
  and wires its export.

## Pull requests

When asked to prepare a PR (the user runs `gh` / creates it), the base branch is `develop` (or
`main` for a release PR), and the description uses (as in `.github/PULL_REQUEST_TEMPLATE.md`):

- **Title**: brief summary.
- **Key Changes**: what changed and anything reviewers should watch.
- **Testing**: which tests pass, which were added, and the exact command to run them.
- **Related Tasks**: links/numbers.
- **Other**: additional notes, including judgment calls not covered by `docs/project_plan.md`.

## Task-completion notifications

Completion notifications are emitted automatically by the **`Stop` hook** in `.claude/settings.json`
(the harness runs it every turn). Do **not** also send `osascript` notifications manually — that
would double-notify.
