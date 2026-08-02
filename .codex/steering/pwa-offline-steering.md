# PWA and Offline Steering

## Product Stance

Trove is local-first. Core value must remain usable without network.

## MUST

- Import, parse, analyze, dedupe, organize, and export must function offline.
- Health checks must be opt-in and disabled by default until consent.
- Service worker behavior must not block app startup when stale caches exist.
- New app versions must present a clear update prompt when available.
- App must gracefully degrade when offline during cloud-assisted actions.
- Persisted workspace schema upgrades must be versioned, additive where possible, and tested against a
  previous-version fixture before release.
- Service-worker activation or reload must never discard an in-progress import, accepted decisions, or
  unsaved export state; persist/checkpoint before prompting the user to reload.

## Caching Rules

- App shell/assets: precache for reliability.
- API calls: network-first with explicit fallback messaging.
- User workspace data: persist in IndexedDB; never depend on cache-only memory.
- Do not cache bookmark contents, workspace payloads, consent state, or health-check POST bodies in the
  service-worker cache. IndexedDB owns local workspace persistence.

## Update/Version Rules

- Never silently swap runtime-critical bundles mid-session.
- Show user-facing "update available" prompt and action.
- Record app version in UI diagnostic section for support/debugging.

## Offline Recovery

- Queue retryable health-check actions only if user opted in.
- Provide explicit status for queued/failed/retried operations.
- Do not lose workspace state due to transient network conditions.
- Handle storage quota, denied persistence, blocked/failed Dexie migrations, and browser eviction with
  recoverable UI. Never claim data is saved until the transaction commits.

## SHOULD

- Keep `ngsw-config` minimal and predictable.
- Avoid over-caching API responses that can confuse status freshness.
- Test the production build over HTTPS or localhost: first load, repeat load, offline reload, installed
  mode, update available/later/reload, storage migration, and return-online behavior.
- Keep external runtime assets optional or locally hosted when their absence would break core offline UX.
