# Cloudflare Platform Steering

## Scope

Defines standards for Cloudflare Worker + D1 implementation, deployment, observability, cost control, and reliability.

## 1. Runtime and Compatibility

## MUST

- Pin `compatibility_date` in `wrangler.toml`; do not leave implicit.
- Update `compatibility_date` only with a tested PR that includes regression checks.
- Document any `nodejs_compat` usage and rationale.

## SHOULD

- Keep runtime features aligned with standard Worker APIs first.

## 2. Environment Strategy

MVP environments: `local`, `prod`.

## MUST

- Keep environment-specific values in Wrangler config and Cloudflare secrets.
- Use deterministic naming conventions for Worker and D1 resources.
- Avoid undocumented env variables or drift between local/prod behavior.

## 3. API Contract Governance

## MUST

- Keep route contracts explicit and versioned when introducing breaking changes.
- Standardize JSON response envelopes for success and error cases.
- Validate incoming request payloads and query params before execution.
- Return clear per-item results for batch endpoints; do not hide partial failures.

## SHOULD

- Keep error responses machine-readable and user-safe.

## 4. D1 Governance

## MUST

- Apply schema changes via migration files only.
- No manual production schema edits.
- Add/maintain indexes for active query paths.
- Keep TTL/retention policy documented for cache rows.

## SHOULD

- Prefer additive migrations during MVP.

## 5. Privacy and Security

## MUST

- Never ingest full bookmark files on backend.
- Never log bookmark file content.
- Minimize raw URL logging; redact or hash where practical.
- Enforce CORS policy to expected app origins.
- Apply basic abuse protections (payload limits, chunk limits, timeout guards).

## SHOULD

- Include request correlation IDs for all logs.

## 6. Observability

## MUST

- Emit structured logs with at least: `requestId`, `route`, `status`, `latencyMs`.
- Distinguish cache hit vs fresh check outcomes.
- Track timeout and upstream failure rates.

## SHOULD

- Maintain a simple operational dashboard for status/error trends.

## 7. Reliability Patterns

## MUST

- Batch checks must tolerate partial upstream failures.
- Endpoint behavior must be deterministic for identical normalized URL input.
- Timeouts must be bounded and configurable within safe limits.

## SHOULD

- Provide cache-only fallback mode during incident windows.

## 8. Cost and Limits

## MUST

- Enforce URL chunk size limits server-side.
- Bound metadata-fetch behavior to avoid request explosion.
- Define behavior when Cloudflare or upstream limits are hit.

## SHOULD

- Keep default chunk size conservative (for MVP baseline).

## 9. Testing and Release Gates

## MUST

- Add route-level tests for batch/single health endpoints.
- Validate classification logic through deterministic fixtures.
- Run build/lint/test/typecheck gates before deploy.

## SHOULD

- Perform smoke checks against production-like config before prod deploy.

## 10. Incident and Rollback

## MUST

- Keep a documented rollback path to last known good deploy.
- Ensure degraded mode can disable fresh checks and serve cache safely.
- Capture incident notes for production-impacting failures.
