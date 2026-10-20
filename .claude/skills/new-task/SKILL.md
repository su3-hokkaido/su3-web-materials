---
name: new-task
description: Scaffold the requirements/design and task-breakdown documents for a new unit of work, following this project's development workflow. Use at the start of any non-trivial task, before writing code, when the user asks to "start a task", "plan X", or "create the design doc".
---

# new-task

Create the paired planning documents this project requires before implementation begins.

## Steps

1. Determine today's date in `yyyy-mm-dd` form. List the directories under `docs/` that start with
   that date and choose the next zero-padded sequence number `NN` for that date (`01` if there are
   none; the sequence restarts every day). Pick a short kebab-case `overview` slug.
   The target directory is `docs/{yyyy-mm-dd}_{NN}_{overview}/`.

2. Enter plan mode and read the relevant sections of `docs/project_plan.md`. Clarify requirements
   with the user first if anything is ambiguous. Do not write code yet.

3. Write `design.md` in that directory with, at minimum:
   - Background / why (link to the relevant section of `docs/project_plan.md`, e.g. `§4`)
   - Requirements and non-goals
   - Technical approach and key decisions (stack: Lit 3 + TypeScript, Shadow DOM with `--su3-*`
     tokens, Storybook web-components-vite, tsdown, Vitest Browser Mode, Playwright VRT,
     Docker + Makefile, Cloudflare Workers Static Assets)
   - Affected files/directories, including impact on design tokens, package `exports`,
     `custom-elements.json`, story titles / clean URLs, VRT baselines and README / README_JA
   - Provenance: confirm nothing is taken from material-web or another project
   - Any judgment call not covered by `docs/project_plan.md`, with its reasoning

4. Write `task.md` in the same directory as a Markdown checklist. Break the work into units small
   enough that each maps to a single commit. Example:
   ```markdown
   # Tasks
   - [ ] Add the component tokens (--su3-comp-toggle-*) under src/shared/tokens
   - [ ] Scaffold su3-toggle with /new-component (element, styles, story, test, index)
   - [ ] Implement the element and cover its behavior in Vitest Browser Mode
   - [ ] Export su3-toggle from the scope's index.ts and package.json exports
   - [ ] Update VRT baselines with make vrt-update
   - [ ] Add a changeset
   ```

5. Suggest the branch commands for the user to run (Claude must not run git):
   ```
   git switch develop && git pull
   git switch -c feature/{overview}
   ```

6. As implementation proceeds, keep `task.md` updated by checking items off. This is mandatory.

## Notes

- `design.md` and `task.md` are written in English, like everything else in the repository. Talk
  to the user in Japanese.
- Do not use emojis.
