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

## Data Rules

- Keep D1 schema aligned with `migrations/` files only; do not hand-mutate prod schemas.
- Preserve privacy stance: only selected URLs are sent, not full bookmark files.
