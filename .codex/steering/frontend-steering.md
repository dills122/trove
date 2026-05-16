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
- Keep components lean; move workflow logic into services/stores.
- Preserve local-first behavior for import, parse, analysis, organization, and export.
- Avoid coupling UI directly to Cloudflare response internals; use DTO mappers.

## Testing

- Add unit tests for normalization, dedupe grouping, and worker contract translation.
- Add component/store tests for state transitions on long-running operations.
