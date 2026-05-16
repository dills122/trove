# Steering Index

Use these steering files together. They are split by concern so repository guidance stays specific without duplication.

## Files

- `repository-steering.md`: monorepo scope, boundaries, and code ownership defaults
- `frontend-steering.md`: Angular app architecture and implementation conventions
- `backend-steering.md`: Cloudflare Worker and D1 conventions for health-check APIs
- `mvp-phasing-steering.md`: MVP phase order and delivery constraints

## Usage Notes

- Prioritize Phase 1-2 completion before broadening feature surface.
- Keep implementation compatible with the MVP design doc in repo root.
- Prefer safe defaults and reversible migrations.
