# Bookmark Cleaner App Guidance

This Angular PWA owns Trove's local-first import, analysis, organization, persistence, and export
workflows. Root `AGENTS.md` and `.codex/steering/*` remain authoritative; the most relevant files here
are the Angular architecture/coding, bookmark import/export, PWA/offline, accessibility, security, and
testing steering documents.

## Stack

- Angular 20 standalone APIs and strict TypeScript
- NgRx Signal Store for shared workflow state; component signals for local presentation state
- Web Workers for parsing and other large transforms
- Dexie/IndexedDB for local workspace persistence
- Angular service worker for the app shell and static assets
- Angular Material plus Tailwind CSS
- Jest and jest-preset-angular for tests

## Local Boundaries

- Keep route features in `src/app/features`, cross-feature domain code in `src/app/core`, and reusable
  presentation primitives in `src/app/shared`.
- Preserve the immutable imported source snapshot. Organize/dedupe state is an action log or typed
  proposal; export materializes source plus accepted decisions.
- Treat bookmark files and every contained field as untrusted. Never render imported markup, execute
  bookmarklets, or bind unreviewed schemes to navigable links.
- Keep import parsing, normalization, analysis, and export materialization in pure modules invoked by a
  typed worker/service boundary. Components must not run large transforms or own raw worker protocols.
- Core workflows must work offline. Cloudflare calls are opt-in health assistance only.
- Persisted schema and worker-contract changes require versioning, migration/compatibility tests, and
  recovery behavior.

## Angular Conventions

- Use standalone components, `ChangeDetectionStrategy.OnPush`, `inject()`, signals/computed values, and
  signal-based inputs/outputs for new code when consistent with nearby files.
- Keep templates semantic, shallow, and side-effect-free. Model loading, empty, error, offline,
  progress, completion, and undo states explicitly.
- Use `interface` for object contracts and discriminated unions for finite state/results/messages.
  Accept `unknown` at external boundaries and narrow it before domain use.
- Preserve keyboard, screen-reader, zoom/reflow, reduced-motion, and visible-focus behavior through all
  import, tree, duplicate, bulk-decision, export, offline, install, and update interactions.

## Verification

- Focused app commands may be used while iterating, but final validation runs from the repository root
  through Rush: `npm run build`, `npm run lint`, `npm run test`, and `npm run typecheck`.
- Add fixtures for real, malformed, adversarial, non-ASCII, and large bookmark exports.
- Test worker success/error/cancellation, store transitions, IndexedDB upgrades, export round trips, and
  production service-worker behavior in addition to component logic.
