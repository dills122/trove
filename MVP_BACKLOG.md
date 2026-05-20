# Trove MVP Backlog

## Epic A: Platform Baseline

### A1. CI and command baseline
Acceptance criteria:
- `rush build`, `rush lint`, `rush test`, `rush typecheck` run in CI
- README documents exact bootstrap and command paths

### A2. Analytics abstraction
Acceptance criteria:
- frontend analytics service exists with opt-out support
- no bookmark content/URL list payloads are emitted

## Epic B: Import and Workspace

### B1. Import page + file pipeline
Acceptance criteria:
- user can upload Chrome bookmark HTML
- app shows parse progress state

### B2. Worker parser scaffold
Acceptance criteria:
- worker returns parsed tree + warnings contract
- parse handles malformed nodes fail-forward

### B3. Workspace persistence
Acceptance criteria:
- original/working snapshots persist to IndexedDB
- refresh restores active workspace state

## Epic C: Analysis and Duplicates

### C1. URL normalization library
Acceptance criteria:
- shared normalization util with unit tests
- tracking param stripping and fragment removal implemented

### C2. Analysis dashboard
Acceptance criteria:
- stats cards and domain/folder/malformed summaries render
- computation is deterministic for fixed fixture

### C3. Duplicate detection
Acceptance criteria:
- exact duplicate groups computed
- possible protocol-variant duplicates surfaced separately

### C4. Duplicate resolution UX
Acceptance criteria:
- user can mark resolution actions
- original snapshot remains unchanged

## Epic D: Organization and Rules

### D1. Global category rule model
Acceptance criteria:
- rules saved globally in IndexedDB
- rules applied in proposed tree build

### D2. Proposed tree preview
Acceptance criteria:
- original vs proposed views shown side-by-side
- accept/reject move interactions update working state

## Epic E: Export

### E1. HTML export generator
Acceptance criteria:
- cleaned and original exports generated
- default filename includes timestamp

### E2. Export format strategy
Acceptance criteria:
- export pipeline is abstraction-based (html now, extensible later)
- UI can list available formats (MVP: HTML; placeholders allowed)

## Epic F: Cloud Health Checks

### F1. Consent-first settings flow
Acceptance criteria:
- first-use prompt is required before checks
- decline keeps app offline-only for health functionality

### F2. Batch health endpoint
Acceptance criteria:
- chunked URL requests supported
- D1 cache read/write and TTL behavior implemented

### F3. Individual URL check endpoint
Acceptance criteria:
- endpoint checks single URL with force-refresh option

### F4. Health UI integration
Acceptance criteria:
- progress and status counters shown
- results persisted locally and reused

## Epic G: Quality and Reliability

### G1. Fixture suite
Acceptance criteria:
- includes small/medium/large fixture (800+)
- parser and analysis tests use fixtures

### G2. Contract tests FE<->BE
Acceptance criteria:
- shared DTO validations in tests
- incompatible response shapes fail CI

### G3. PWA update UX
Acceptance criteria:
- new version prompt exists
- stale app guidance visible to users

## Epic H: Sprint PWA + Refactor

### H1. Manifest + metadata baseline
Acceptance criteria:
- `manifest.webmanifest` exists with installable fields
- `index.html` includes manifest + required PWA metadata
- icon set includes 192/512 and maskable variant

### H2. Service worker production wiring
Acceptance criteria:
- Angular SW enabled in production build
- service worker is registered and active post-build
- `ngsw-config.json` defines app-shell/asset cache groups

### H3. Install + update lifecycle
Acceptance criteria:
- install prompt flow is exposed through UI
- app update prompt appears when a new build is available
- user can reload/apply update from prompt

### H4. Offline experience baseline
Acceptance criteria:
- app shell loads when offline after first online visit
- offline state indicator is visible and clear
- local snapshot review flow remains usable offline

### H5. Import page decomposition
Acceptance criteria:
- oversized inline import template moved to dedicated template/style files
- first-run modal/export guide sections are split into reusable components where practical
- behavior parity with pre-refactor flow is maintained

### H6. Component/service complexity guardrails
Acceptance criteria:
- no high-traffic route component exceeds agreed size threshold
- orchestration logic extracted to focused services
- tests updated for extracted logic paths
