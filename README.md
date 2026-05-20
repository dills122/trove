# Trove Monorepo

Trove is a local-first bookmark cleanup MVP.

## Projects

- `apps/bookmark-cleaner`: Angular + Material + Tailwind PWA frontend
- `services/link-health-worker`: Cloudflare Worker + D1 service for link health checks

## Getting started

1. Ensure Node `>=20.14.0 <23.0.0` is active.
2. Run `node common/scripts/install-run-rush.js update`.
3. Run `node common/scripts/install-run-rush.js build`.

Useful commands:
- `npm run dev:web`
- `npm run dev:worker`
- `npm run lint`
- `npm run test`
- `npm run typecheck`

## GitHub Pages Deploy

- Workflow: `.github/workflows/pages-deploy.yml`
- Deploy target: `gh-pages` branch from `apps/bookmark-cleaner/dist/angular-mat-tailwind-starter/browser`
- Trigger: pushes to `main` that touch app/build files, or manual dispatch

Custom domain support:
- Set repository variable `PAGES_CNAME` (for example `trove.dsteele.dev`)
- The workflow passes this value as the deploy `cname`
- In GitHub repo settings, set Pages source to `gh-pages` branch

## Planning docs

- `TECH_DESIGN.md`
- `IMPLEMENTATION_PLAN.md`
- `MVP_BACKLOG.md`
- `WORKPLAN.md`
- `NEXT_STEPS.md`

## Source MVP reference

- `Below is a full MVP tech design you coul.md`
