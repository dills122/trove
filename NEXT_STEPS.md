# Next Steps

## Immediate

1. Execute `SPRINT_PWA_REFACTOR_PLAN.md` as active sprint.
2. Implement PWA foundation: manifest, service worker wiring, install/update UX.
3. Add offline-state UX and validate offline review workflow.
4. Refactor oversized route components/templates, starting with import flow decomposition.

## Backend Follow-Up

1. Replace stubbed worker health responses with real fetch + classification logic.
2. Implement D1-backed cache read/write path with TTL policy.
3. Add route-level tests for batch and individual endpoints.

## Tooling Follow-Up

1. Add Lighthouse/PWA checks to CI for installability and offline baseline validation.
2. Add component/template complexity guardrails to lint or PR checklist.
