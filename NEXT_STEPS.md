# Next Steps

## Immediate

1. Scaffold Angular feature folders and routes from MVP spec.
2. Add shared bookmark models and worker request/response contracts.
3. Implement import page flow (upload -> worker parse -> store snapshot).
4. Add dashboard placeholder wired to analysis state.

## Backend Follow-Up

1. Replace stubbed worker health responses with real fetch + classification logic.
2. Implement D1-backed cache read/write path with TTL policy.
3. Add route-level tests for batch and individual endpoints.

## Tooling Follow-Up

1. Add repo-level lint/format command mapping in Rush command-line config.
2. Add CI checks for `rush build` and test targets.
