# Trove MVP Technical Design

## 1. Product Scope

Trove is a local-first bookmark cleanup PWA.

MVP goals:
- Import Chrome bookmark HTML
- Parse/analyze locally
- Detect exact and possible duplicates
- Suggest organization rules and proposed tree
- Preview all changes before export
- Export cleaned output in browser-compatible formats
- Optionally run cloud-assisted health checks (opt-in only)

MVP non-goals:
- user accounts
- browser extension sync/writeback
- automatic destructive edits to browser bookmarks
- AI categorization

## 2. Architecture

### 2.1 Frontend
- Angular standalone app (`apps/bookmark-cleaner`)
- Angular Signals for workspace state
- Web Worker for CPU-heavy parse/analyze/export operations
- Dexie + IndexedDB for persistence
- Angular Material + Tailwind for UI
- Angular Service Worker for PWA capabilities

### 2.2 Backend
- Cloudflare Worker (`services/link-health-worker`)
- D1 cache for normalized URL health results
- Routes:
  - `GET /api/health`
  - `POST /api/link-health/batch`
  - `GET /api/link-health?url=...`

### 2.3 Hosting/Environments
- Frontend deploy: Cloudflare Pages
- Backend deploy: Cloudflare Workers
- Environments: `local`, `prod`

## 3. Privacy and Consent

Default mode is fully local/offline-compatible.

Health checks are opt-in only:
- first-use consent prompt explains URL-only transmission
- if declined, health-check features stay disabled
- user can enable/disable later in settings

Data policy:
- Bookmark file is never uploaded as a full document
- parsing/analysis/organization remain local
- only selected URLs are sent when health checks are enabled

## 4. Core Data Model

High-level entities:
- `BookmarkFolder`
- `BookmarkLink`
- `BookmarkAnalysis`
- `DuplicateGroup`
- `CategoryRule`
- `LinkHealthResult`
- `WorkspaceSettings`

### 4.1 Workspace State Model
- `originalTree`: imported source snapshot (immutable reference)
- `workingTree`: user-modified preview state
- `proposedTree`: rules-generated candidate tree
- `analysis`: computed stats
- `healthResults`: normalized URL health map
- `warnings`: parse/normalization warnings

This model enforces non-destructive behavior and "swap-file" workflow semantics.

## 5. IndexedDB Schema (Dexie)

Tables:
- `workspaces`
- `bookmarks`
- `health_results`
- `category_rules`
- `settings`

Guidelines:
- schema versioning from day one
- additive migrations only in MVP
- no destructive migration during active workspace usage

## 6. Import/Parse Behavior

Input scope:
- Chrome bookmark HTML (MVP primary support)

Robust parsing rules:
- parse as much as possible
- warnings for malformed or partially invalid nodes
- if URL exists, keep link candidate
- if title missing, derive from URL/domain/path
- skip only irrecoverably invalid nodes

## 7. Duplicate Semantics

Duplicate classes:
1. Exact duplicate:
- same normalized URL

2. Possible duplicate:
- protocol variants (`http`/`https`) or closely related normalized forms

3. Confirmed duplicate:
- resolved by health-check redirect/final URL evidence

UX rules:
- label clearly as exact/possible/confirmed
- no automatic delete
- user confirms all destructive outcomes before export

## 8. URL Normalization

Base normalization:
- lowercase protocol/hostname
- trim trailing slash for root path
- remove fragment
- strip common tracking params (`utm_*`, `fbclid`, `gclid`, etc.)

Important rule:
- `http` and `https` are not auto-identical in MVP
- they can be surfaced as possible duplicates and optionally verified

## 9. Health Check Workflow

Flow:
1. User enables health checks via consent
2. Frontend sends unique URLs in chunks (default 25)
3. Worker checks D1 cache first
4. Worker performs HEAD/GET fallback for fresh checks
5. Results are returned and saved locally

Classification:
- `alive`, `redirected`, `dead`, `timeout`, `blocked`, `auth-required`, `unknown`

## 10. Export Model

MVP exports:
- original snapshot export
- cleaned/proposed export

Filename default:
- `bookmarks-cleaned-YYYYMMDD-HHmm.html`

Future format support:
- architecture should keep export pipeline pluggable for additional formats.

## 11. PWA Caching and Update Strategy

Caching strategy:
- app shell precache
- static assets stale-while-revalidate
- API calls network-first

Stale UI mitigation:
- app version indicator
- "New version available" refresh prompt

## 12. Observability and Telemetry

MVP telemetry is enabled with privacy constraints:
- anonymous product analytics/events only
- no bookmark content payloads
- no full URL lists in analytics

Capture:
- import started/completed
- parse warning counts
- duplicate review actions
- health-check consent status and run summaries
- export started/completed
- anonymized error events

## 13. Testing Strategy

Frontend:
- unit: normalization, parser transforms, dedupe grouping, stores
- integration: import -> analyze -> duplicates -> export

Backend:
- unit/integration: classification, cache hit/miss, timeout behavior
- contract tests: request/response schema compatibility

Fixtures:
- small, medium, large (800+ bookmarks) datasets

## 14. Key Risks and Mitigations

1. Parser edge cases
- Mitigation: tolerant parse + warning channel + fixture coverage

2. Large-file performance
- Mitigation: worker pipeline + chunking/progress updates

3. Schema churn
- Mitigation: strict versioned migrations and additive changes

4. Duplicate trust/usability
- Mitigation: exact vs possible vs confirmed labels and preview-first UX

5. PWA stale experiences
- Mitigation: update banner + network/cache strategy

## 15. Review Analytics Roadmap

This section defines feasible analytics ideas, grouped by implementation readiness.

### 15.1 MVP-Now (Import-Only Data, Local Compute)

These require only imported bookmark HTML + local analysis:

- Domain dependency:
  - top domains concentration (`top 5` share)
  - single-point dependency warnings
- Duplicate intent analytics:
  - exact duplicates (`normalizedUrl`)
  - possible intent duplicates (`host + normalized title`)
  - potential removal estimates
- Organization quality:
  - folder depth distribution
  - empty/derived-title indicators
  - average links per folder
- Structure/story metrics:
  - host and registrable-domain diversity
  - bookmarklet concentration
  - protocol distribution (compact display only)
- Composite cleanup index:
  - weighted score from duplicates, malformed entries, and domain concentration

### 15.2 MVP-Next (Opt-In Cloud Assist Required)

These require Cloudflare Worker health checks and optional D1 cache:

- alive/dead/timeout/redirect classifications
- redirect drift (saved URL vs final URL)
- domain fragility rates (dead/timeout by domain)
- most fragile folders/collections
- wayback suggestion hooks for dead links

### 15.3 Post-MVP (Additional Behavioral Data Required)

These require revisit/open telemetry and timeline storage (not in current MVP model):

- save vs consume ratio
- bookmark half-life and revisit decay
- hoarding velocity / phase timelines
- intent vs action completion metrics
- rediscovery “on this day” feed

## 16. Sprint: PWA Hardening + Refactor

This sprint establishes production-ready PWA foundations and reduces architecture risk from oversized components.

### 16.1 PWA Outcomes
- installable app manifest and icon model
- production Angular service worker enablement
- app-shell and asset caching strategy
- offline-state UX messaging and behavior expectations
- update prompt flow for newly deployed versions
- proactive update checks (startup, online re-entry, tab visibility return, periodic interval)
- unrecoverable service worker recovery banner/flow
- iOS Safari manual install guidance fallback when `beforeinstallprompt` is unavailable

### 16.2 Refactor Outcomes
- break large inline templates into dedicated component templates/styles
- extract reusable workflow UI blocks into focused components
- move orchestration logic out of page components into dedicated services
- enforce component/template size guardrails to prevent regressions

### 16.3 Constraints
- preserve local-first behavior and non-destructive workflow semantics
- avoid behavioral regressions during decomposition
- keep cloud-assisted paths strictly opt-in

### 15.4 Post-MVP Advanced (ML/Graph Investment)

- semantic clustering and “era” detection
- project inference from bookmark groups
- knowledge graph visualization
- personality/wrapped-style profiling

### 15.5 Review Page Metric Principles

- prioritize actionable metrics over novelty
- avoid duplicate metrics across cards
- keep narrative hierarchy:
  1. core counts
  2. cleanup impact
  3. dependency/structure diagnostics
- mobile-first density controls (collapse/expand where needed)
