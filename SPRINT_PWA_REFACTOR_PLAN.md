# Sprint Plan: PWA Hardening + Architecture Refactor

## Sprint Goal
Deliver installable, offline-capable PWA foundations while reducing frontend architecture risk by breaking large components/templates into maintainable modules.

## Scope

### Track A: PWA Hardening (Implementation)

1. Manifest + icon strategy
- Add `manifest.webmanifest` with:
  - `name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, `background_color`
  - icon set (`192`, `512`, maskable)
  - app description and categories
- Wire manifest and PWA meta tags in `src/index.html`

2. Service worker baseline
- Add Angular service worker config (`ngsw-config.json`)
- Enable service worker in production build config
- Register SW in app bootstrap/config

3. Caching + offline behavior
- App-shell precache
- Asset cache groups for static content
- Runtime strategy for optional network calls
- Offline banner/state indicators in UI

4. Install/update UX
- `beforeinstallprompt` handling service
- Install CTA in header/settings context
- SW update available prompt with reload flow

5. Verification
- Installability test pass on Chrome desktop/mobile
- Offline reload test pass
- Update flow smoke test pass

### Track B: Frontend Refactor (Implementation)

1. Template decomposition
- Break oversized inline templates into dedicated `*.component.html` and `*.component.scss`
- Prioritize `ImportPageComponent` and any view above ~200 template lines

2. Component extraction
- Extract reusable UI blocks:
  - Environment summary/controls
  - Export guide walkthrough
  - First-run modal content
  - Stats card/list primitives

3. Service/store boundaries
- Introduce focused services for:
  - install prompt/update lifecycle
  - platform/environment detection
  - import guide content model
- Keep stores focused on state, move orchestration out of components

4. Size/complexity guardrails
- No component with >300 LOC (target)
- No inline template >40 LOC (target)
- Keep business logic out of templates

5. Refactor safety checks
- Keep behavior unchanged unless explicitly targeted
- Add/adjust tests around extracted logic
- Ensure route-level smoke tests pass

## Deliverables
- Installable PWA baseline in production build
- Offline-capable shell + clear offline UX
- Update notification flow
- Decomposed import flow and reduced component complexity
- Updated docs and backlog tied to this sprint

## Definition of Done
- `rush build`, `rush lint`, `rush test`, `rush typecheck` pass
- Manual QA:
  - first load online
  - install app
  - reload offline
  - import/review still works from local snapshot
  - update prompt appears when new version is available
- Tech docs/backlog updated with implemented architecture decisions

## Out of Scope
- Full cross-browser PWA parity beyond Chrome-first MVP
- Advanced background sync workflows
- Push notifications

## Execution Order (Recommended)
1. PWA foundation wiring (manifest + SW)
2. Install/update UX
3. Import page template/component decomposition
4. Shared component extraction
5. Final QA pass + docs cleanup
