# Phase 8: README, catalog pages and first-publish documentation

## Background

`docs/project_plan.md` section 12 (Documentation) and section 14 (Phase 8). Phases 1-7 delivered the
catalog, the package, VRT, the workflows and the MVP components. The root `README.md` is a stub,
`README_JA.md` and `THIRD_PARTY_NOTICES.md` do not exist, the Storybook has no foundation pages, and
the owner's one-time setup and the manual first publish live only in the Phase 6 design document.

## Requirements

- `README.md` (English) with the nine sections of section 12; `README_JA.md` mirrors it (same
  headings, code blocks and links).
- Every code snippet in the README is taken from a consumer fixture under `tests/consumers`.
- `THIRD_PARTY_NOTICES.md` lists every bundled font or icon (none) and the runtime dependency.
- Storybook shows the foundation pages: Getting started, Theming, Accessibility, Browser support,
  Design language.
- The leftover `README_sample_from_another_repo.md` is removed.

## Non-goals

The real first publish, Cloudflare or GitHub configuration (documented, performed by the owner),
new components, token changes, framework wrappers.

## Technical approach and key decisions

1. README follows section 12; commands come from `make help`, setup steps from section 8.
2. The foundation pages are MDX files in `src/shared/docs/`, included through a new
   `../src/shared/**/*.mdx` entry in `.storybook/main.ts`, titled `Foundation/...`. Docs entries are
   not stories, so VRT, the story-title uniqueness rule and clean URLs are unaffected.
3. `THIRD_PARTY_NOTICES.md`: nothing is bundled (system font stacks, inline SVG icons authored in
   this repository); `lit` (BSD-3-Clause) is the only runtime dependency.
4. README ships in the npm package, so the existing initial changeset is reused (no second one).

## Affected files and directories

- New: `README_JA.md`, `THIRD_PARTY_NOTICES.md`, `src/shared/docs/*.mdx`.
- Modified: `README.md`, `.storybook/main.ts`, `CLAUDE.md`, `docs/project_plan.md` (sections 12, 14,
  15, 17), component story docs where usage notes are missing.
- Removed: `README_sample_from_another_repo.md`.
- Tokens, package `exports`, story titles, clean URLs and VRT baselines: unchanged.

## Provenance

All text is written for this repository; nothing is taken from material-web. The removed sample
README belonged to the owner's template and is not reused verbatim.

## Judgment calls

- No `foundation` component category: the foundation pages are docs only (see Phase 7).
- MDX pages live under `src/shared/docs/` rather than `docs/`, because Storybook only globs `src`
  and the repository `docs/` folder is for development documents.
