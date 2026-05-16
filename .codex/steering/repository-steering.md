# Repository Scope And Priorities

This repository builds a bookmark cleanup product as a local-first web app with cloud-assisted link health checks.

Primary deliverables:

- Angular PWA in `apps/bookmark-cleaner`
- Cloudflare Worker API in `services/link-health-worker`

Core priorities:

- deterministic local bookmark processing
- safe, preview-first user experience
- stable typed contracts between frontend and backend
- maintainable monorepo workflows through Rush

## Active Boundaries

- Frontend app owns parsing orchestration, analysis UX, dedupe/organize workflows, and export UX.
- Worker owns URL health checking behavior and D1 health cache access.
- Do not move bookmark file uploads/parsing to backend for MVP.

## Safe Refactor Boundaries

Do not refactor these without explicit instruction:

- app/service project names and paths registered in `rush.json`
- Cloudflare API route surfaces once wired into UI
- core bookmark model semantics used by parse/analyze/export flows

Safe default changes:

- feature-scoped UI improvements
- worker endpoint hardening and classification logic
- focused test additions and typing improvements
