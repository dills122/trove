# Trove Monorepo

This repository is scaffolded for the Bookmark Utility MVP.

## Projects

- `apps/bookmark-cleaner`: Angular + Material + Tailwind PWA frontend
- `services/link-health-worker`: Cloudflare Worker + D1 service for link health checks

## Getting started

1. Ensure Node 20+ is active.
2. Run `node common/scripts/install-run-rush.js update`.
3. Run `rush build`.

Run specific projects:

- Frontend: `rushx start` from `apps/bookmark-cleaner`
- Worker: `rushx dev` from `services/link-health-worker`

## MVP doc

Source doc:

- `Below is a full MVP tech design you coul.md`
