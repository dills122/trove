# Next Steps

## Immediate

1. Implement `OrganizeStore` using NgRx Signal Store on top of the new store foundation utilities.
2. Add organize action-log + undo/redo primitives to drive deterministic duplicate-review decisions.
3. Wire organize UI actions (`keep newest/oldest/selected`, `remove selected`, `skip`) to derived projected impact.
4. Materialize export from source snapshot + accepted decision patches.

## Backend Follow-Up

1. Replace stubbed worker health responses with real fetch + classification logic.
2. Implement D1-backed cache read/write path with TTL policy.
3. Add route-level tests for batch and individual endpoints.

## Tooling Follow-Up

1. Add Lighthouse/PWA checks to CI for installability and offline baseline validation.
2. Add component/template complexity guardrails to lint or PR checklist.
3. Add store-convention checklist (state shape, persistence, action-log tests) to PR template.
