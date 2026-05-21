# Trove MVP Implementation Plan

## 1. Delivery Principles

- Local-first by default
- Non-destructive UX always
- Vertical slices with tests
- Keep scope tied to MVP phases

## 2. Milestone Plan

### Milestone 0: Foundation Hardening
Duration: 1-2 days

Deliverables:
- lock project tooling and Rush commands
- CI checks for build/lint/test/typecheck
- base analytics/event abstraction (no sensitive payloads)

Exit criteria:
- local and CI validation pass
- contributors can run a single documented bootstrap path

### Milestone 1: Import Engine
Duration: 3-4 days

Deliverables:
- import route/page
- file upload + parse worker contract
- parse warnings model
- original snapshot + working snapshot persistence

Exit criteria:
- imports Chrome HTML including 800+ bookmark sample without crash
- warnings surfaced for malformed records

### Milestone 2: Analysis Dashboard
Duration: 2-3 days

Deliverables:
- flatten and normalize pipeline
- stats computation (counts, domains, malformed)
- dashboard UI cards/lists
- review analytics v1:
  - domain dependency concentration
  - structure quality metrics
  - cleanup index baseline

Exit criteria:
- deterministic analysis from same input
- normalization tests in place

### Milestone 3: Duplicate Workflow
Duration: 3-4 days

Deliverables:
- exact duplicate grouping
- possible duplicate grouping (`http`/`https` variants)
- organize decision/action-log model and preview impact
- per-group actions:
  - keep newest/oldest/selected
  - remove selected
  - keep all / skip
- bulk strategy apply for exact groups
- duplicate intent analytics:
  - host+title “possible intent” clusters
  - potential removal and duplicate coverage summaries
- undo/redo over decision history

Exit criteria:
- user can resolve duplicates without mutating original snapshot
- projected export impact updates deterministically from decisions

### Milestone 4: Organization Rules
Duration: 3-5 days

Deliverables:
- global category rules CRUD
- proposed tree build in worker
- approve/reject move flow

Exit criteria:
- proposed tree preview and selective acceptance are functional

### Milestone 5: Export
Duration: 2 days

Deliverables:
- export original and cleaned outputs
- standardized auto filename
- compatibility verification with Chrome import
- materialization pipeline from source snapshot + accepted patches/decisions
- optional empty-folder cleanup toggle

Exit criteria:
- exported HTML imports back into Chrome successfully

### Milestone 6: Health Checks (Opt-In)
Duration: 4-6 days

Deliverables:
- consent-first health settings
- batch and single-url check endpoints
- D1 cache behavior with TTL
- health status UI and progressive updates
- health analytics:
  - alive/dead/redirect/timeout mix
  - domain fragility table
  - fragile collection detection

Exit criteria:
- health checks work only after consent
- chunked processing and result persistence validated

## 3. Cross-Cutting Workstreams

### 3.0 State Management
- adopt NgRx Signal Store for feature stores in MVP
- keep organize logic as action-log + derived selectors
- avoid full global NgRx Store/Effects until complexity thresholds are hit

### 3.1 UX & Product Quality
- warning clarity and user confidence messaging
- explicit labels for possible vs confirmed duplicates
- no hidden destructive actions
- prefer “storytelling” analytics (dependency, cleanup impact, fragility) over vanity metrics

### 3.2 Performance
- worker event progress updates
- chunk-based processing patterns from start
- large fixture benchmark in CI (or nightly)

### 3.3 Security & Privacy
- sanitize and validate all external inputs
- restrict telemetry to anonymized metrics
- document data flow in privacy copy

## 4. Definition of Done (Per Story)

- feature implemented
- tests added/updated
- docs adjusted if behavior changed
- no regression in `rush build/lint/test/typecheck`
- UX copy reviewed for clarity where user-facing

## 5. Suggested Execution Order (First 2 Sprints)

Sprint A:
- Milestone 0
- Milestone 1
- start Milestone 2

Sprint B:
- finish Milestone 2
- Milestone 3
- start Milestone 4

Sprint C:
- PWA hardening implementation:
  - manifest, icons, service worker wiring
  - install prompt and update prompt UX
  - offline state UX + cache strategy validation
- architecture refactor pass:
  - decompose oversized inline templates
  - extract reusable workflow components/services
  - reduce route component complexity and improve maintainability
