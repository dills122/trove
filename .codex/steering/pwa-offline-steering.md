# PWA and Offline Steering

## Product Stance

Trove is local-first. Core value must remain usable without network.

## MUST

- Import, parse, analyze, dedupe, organize, and export must function offline.
- Health checks must be opt-in and disabled by default until consent.
- Service worker behavior must not block app startup when stale caches exist.
- New app versions must present a clear update prompt when available.
- App must gracefully degrade when offline during cloud-assisted actions.

## Caching Rules

- App shell/assets: precache for reliability.
- API calls: network-first with explicit fallback messaging.
- User workspace data: persist in IndexedDB; never depend on cache-only memory.

## Update/Version Rules

- Never silently swap runtime-critical bundles mid-session.
- Show user-facing "update available" prompt and action.
- Record app version in UI diagnostic section for support/debugging.

## Offline Recovery

- Queue retryable health-check actions only if user opted in.
- Provide explicit status for queued/failed/retried operations.
- Do not lose workspace state due to transient network conditions.

## SHOULD

- Keep `ngsw-config` minimal and predictable.
- Avoid over-caching API responses that can confuse status freshness.
