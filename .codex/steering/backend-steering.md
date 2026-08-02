# Backend Steering (Cloudflare Worker)

Target stack:

- Cloudflare Workers
- D1 for health-result cache
- Wrangler for local/dev/deploy operations

## Backend Rules

- Expose only MVP health-check routes:
  - `POST /api/link-health/batch`
  - `GET /api/link-health`
  - optional `GET /api/health`
- Normalize URLs consistently before cache lookup and persistence.
- Use classification mapping that is deterministic and documented.
- Keep request timeouts explicit and bounded.
- Return typed response envelopes with per-URL status and summary counts.

## URL Fetch Safety

- Accept only canonical HTTP(S) URLs without embedded credentials.
- Resolve and reject loopback, private, link-local, reserved, multicast, and provider-metadata targets.
  Re-run the same validation on every redirect and cap redirect depth.
- Guard against DNS rebinding and alternate IP encodings; validate the effective destination as close to
  the outbound fetch as the platform permits.
- Bound batch size, concurrency, connect/overall time, response bytes, and fallback GET behavior. Do not
  download or parse full response bodies when status/headers are sufficient.
- Keep classification deterministic: transport failure, timeout, blocked target, auth requirement,
  redirect, and HTTP failure are distinct typed outcomes.
- Return user-safe errors and content-minimized logs; never reflect upstream bodies or sensitive headers.

## Data Rules

- Keep D1 schema aligned with `migrations/` files only; do not hand-mutate prod schemas.
- Preserve privacy stance: only selected URLs are sent, not full bookmark files.
- Cache keys derive from the shared normalization contract. Do not persist URL credentials, request
  headers, response bodies, bookmark metadata, or unrelated query data.
