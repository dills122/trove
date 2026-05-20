# Testing and Quality Gates Steering

## Required Test Layers

- Unit tests for core transforms (parse, normalize, dedupe logic).
- Integration tests for route-level workflow slices.
- Backend route and classification tests for cloud worker.
- Fixture-based tests with realistic bookmark exports.

## MUST

- `rush build`, `rush lint`, `rush test`, and `rush typecheck` pass before merge.
- New features include tests for success and failure paths.
- Contract shape changes require test updates on producer and consumer sides.
- Regressions in import or export compatibility block merge.

## SHOULD

- Include accessibility checks in CI for critical routes.
- Track flaky tests and fix quickly; do not normalize flakiness.

## Coverage Focus

- Prioritize correctness around data transforms and destructive-action safeguards.
- Use large fixture tests to catch performance/robustness regressions.
