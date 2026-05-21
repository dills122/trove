<p align="center">
  <img src="assets/logo-with-text-clean.png" alt="Trove" width="680" />
</p>

# Trove

Trove is a local-first bookmark cleanup app. Import a browser bookmark export, analyze quality and duplication, then organize and export safely without mutating the source file.

## Repo Layout

- `apps/bookmark-cleaner` Angular + Material + Tailwind PWA frontend
- `services/link-health-worker` Cloudflare Worker service for optional link health checks
- `common` Rush shared configuration and scripts

## Prerequisites

- Node `>=20.14.0 <23.0.0`
- npm (used by Rush)

## Quick Start

1. Install dependencies:
   - `node common/scripts/install-run-rush.js update`
2. Build all projects:
   - `node common/scripts/install-run-rush.js build`
3. Run the web app locally:
   - `npm run dev:web`
4. (Optional) Run the worker locally:
   - `npm run dev:worker`

## Common Commands

- `npm run dev:web` Run Angular app
- `npm run dev:worker` Run Cloudflare worker locally
- `npm run build` Build all Rush projects
- `npm run lint` Run lint checks
- `npm run test` Run tests
- `npm run typecheck` Run type checking

## Deployment (GitHub Pages)

- Workflow: `.github/workflows/pages-deploy.yml`
- Publishes the web app build to `gh-pages`
- Supports custom domain through repository variable `PAGES_CNAME`

## PWA QA

- Manual install/update/offline verification checklist:
  - `PWA_QA_CHECKLIST.md`

## Planning and Design Docs

- `TECH_DESIGN.md`
- `IMPLEMENTATION_PLAN.md`
- `MVP_BACKLOG.md`
- `WORKPLAN.md`
- `NEXT_STEPS.md`
