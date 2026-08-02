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

## Stack And Command Map

- Frontend: Angular 20 standalone APIs, NgRx Signal Store, Web Workers, Dexie/IndexedDB, Angular
  service worker, Angular Material, and Tailwind CSS.
- Cloud assist: Cloudflare Worker and D1, limited to opt-in link-health checks.
- Run repository tasks through Rush from the root: `npm run build`, `npm run lint`, `npm run test`,
  and `npm run typecheck` (each delegates to `common/scripts/install-run-rush.js`).
- Do not run standalone root `pnpm install`, create a root lockfile, or bypass `rush.json` project
  registration. Package-local commands are for focused diagnosis only; final gates run through Rush.

## Active Boundaries

- Frontend app owns parsing orchestration, analysis UX, dedupe/organize workflows, and export UX.
- Worker owns URL health checking behavior and D1 health cache access.
- Do not move bookmark file uploads/parsing to backend for MVP.
- Netscape bookmark HTML is the current import format. Future XML or browser formats use separate,
  typed adapters rather than branching format quirks through one parser.
- Never make a cleaned export the only surviving copy; source data and accepted decisions remain
  independently recoverable.

## Safe Refactor Boundaries

Do not refactor these without explicit instruction:

- app/service project names and paths registered in `rush.json`
- Cloudflare API route surfaces once wired into UI
- core bookmark model semantics used by parse/analyze/export flows

Safe default changes:

- feature-scoped UI improvements
- worker endpoint hardening and classification logic
- focused test additions and typing improvements
