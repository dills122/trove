# Frontend Steering (Angular)

Target stack:

- Angular standalone APIs
- Angular Signals for local app state
- Angular Material + Tailwind for UI
- Web Worker for parse/analyze/build/export heavy operations
- IndexedDB (Dexie) for local persistence

## Frontend Rules

- Organize by feature/domain under `src/app/features` and shared primitives under `src/app/shared`.
- Keep worker message contracts explicit and versionable.
- Read untrusted files through a bounded import service and hand them to workers; route components own
  user intent and display state, not parsing details.
- Keep components lean; move workflow logic into services/stores.
- Preserve local-first behavior for import, parse, analysis, organization, and export.
- Avoid coupling UI directly to Cloudflare response internals; use DTO mappers.
- Render imported titles, paths, warnings, and URLs as text. Do not use `innerHTML` or Angular security
  bypass APIs for bookmark content.
- Centralize external-link rendering. Permit only reviewed schemes, block bookmarklet navigation, and
  use `rel="noopener noreferrer"` when opening HTTP(S) links in a new context.
- Keep long-running operations cancellable where practical and expose bounded progress, failure, retry,
  and recovery states without freezing the main thread.

## Testing

- Add unit tests for normalization, dedupe grouping, and worker contract translation.
- Add component/store tests for state transitions on long-running operations.
- Add interaction tests for file selection, progress/error announcements, preview/undo flows, unsafe
  scheme display, offline mode, and service-worker update prompts.
