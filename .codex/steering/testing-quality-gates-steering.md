# Testing and Quality Gates Steering

## Required Test Layers

- Unit tests for core transforms (parse, normalize, dedupe logic).
- Integration tests for route-level workflow slices.
- Backend route and classification tests for cloud worker.
- Fixture-based tests with realistic bookmark exports.
- Worker protocol tests for success, malformed input, progress, cancellation/termination, and errors.
- Production-build browser tests for service-worker install, offline reload, updates, and recovery.

## MUST

- `rush build`, `rush lint`, `rush test`, and `rush typecheck` pass before merge.
- New features include tests for success and failure paths.
- Contract shape changes require test updates on producer and consumer sides.
- Regressions in import or export compatibility block merge.
- Parser tests must cover malformed nesting, mixed-case/quoted attributes, entities, non-ASCII text,
  duplicate fields, deep/large inputs, unsafe schemes/bookmarklets, and configured resource limits.
- XML support, if added, must include DTD/external-entity/entity-expansion rejection fixtures.
- Export tests must round-trip adversarial and realistic fixtures without executing or corrupting data.
- Link-health tests must cover private/reserved targets, redirects to unsafe targets, DNS/connection
  failures, timeout/size limits, partial batch failures, cache behavior, and normalized-key parity.

## SHOULD

- Include accessibility checks in CI for critical routes.
- Track flaky tests and fix quickly; do not normalize flakiness.

## Coverage Focus

- Prioritize correctness around data transforms and destructive-action safeguards.
- Use large fixture tests to catch performance/robustness regressions.
- Keep deterministic golden/fixture assertions for normalization and source-plus-decision export
  materialization. Benchmark large imports off the main thread and set a documented regression budget.
