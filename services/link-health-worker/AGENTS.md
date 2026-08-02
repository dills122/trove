# Link Health Worker Guidance

This Cloudflare Worker is cloud-assist only. It accepts explicitly selected URLs for health checks and
uses D1 as a bounded result cache; it never receives bookmark files, titles, folder paths, or tags.

Follow root `AGENTS.md` plus backend, Cloudflare platform, security/privacy, testing, and bookmark
import/export steering.

## Non-Negotiable Boundaries

- Keep request/response DTOs aligned with the Angular client and version breaking changes.
- Validate request shape, URL count/length, method, scheme, credentials, and normalized cache key.
- Treat fetching caller-supplied URLs as SSRF-sensitive. Reject unsafe address classes and revalidate
  every redirect; cap redirects, concurrency, time, retries, and response bytes.
- Never return upstream bodies or sensitive headers. Keep errors typed, deterministic, user-safe, and
  content-minimized in logs.
- Use D1 migrations for schema changes. Keep cache TTL, indexes, retention, and normalization behavior
  explicit and tested.
- Tolerate partial batch failures and preserve per-item outcomes. Do not turn one slow or hostile target
  into batch-wide failure or resource exhaustion.

## Verification

- Add tests for validation, normalization parity, cache hit/miss/expiry, classification, partial batches,
  unsafe targets and redirects, timeouts, response limits, and degraded/cache-only behavior.
- Final validation runs through the repository's Rush commands from the root.
