# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add `.dockerignore` and `.env.docker.sample` (ports and product only; no secrets entries)
- [x] Add the `Dockerfile` with the `base` and `dev` stages, including the Chromium install
- [x] Add `compose.yaml` with the `storybook` service
- [x] Add the `Makefile` with the Docker targets and `help`
- [x] Add the `local-*` targets for hosts that have Node.js
- [x] Re-enable and extend the Dockerfile checks in `src/conventions.test.ts`
- [x] Verify end to end in Docker (`make setup`, `make ci`, `make dev`, `make clean`) and fix
      findings; if Docker is unavailable, verify statically and hand the commands to the owner
- [x] Self-review shell quoting and make portability (macOS make 3.81, GNU make 4)
- [x] Record the decisions in `docs/project_plan.md` sections 5, 14 and 17 and update `CLAUDE.md`
