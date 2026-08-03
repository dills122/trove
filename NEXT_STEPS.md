# Next Steps

## Immediate

The detailed sequence and scope live in `CLEANUP_FLOW_PLAN.md`.

1. Complete Slice 0: version the snapshot/worker contracts and preserve source values, timestamps, stable IDs,
   and a source revision.
2. Define typed cleaner proposals, patches, decision batches, conflicts, and the source-plus-decisions materializer.
3. Complete Slice 1: implement the exact-duplicate worker pipeline and `OrganizeStore` with persistence,
   projected impact, undo, and redo.
4. Replace the organize placeholder with duplicate review plus the accepted/rejected/conflicted Changes queue.
5. Add the Export route only after preview uses the shared materializer.

## Then

1. Add known-tracking-parameter and missing-title cleaners.
2. Add manual moves, narrow domain category rules, duplicate sibling-folder proposals, and export-time empty-folder
   pruning.
3. Finish original/cleaned HTML serialization and adversarial round-trip tests.
4. Add opt-in health-derived cleaners after the complete local cleanup/export workflow is shippable.

## Backend Follow-Up

1. Replace stubbed worker health responses with real fetch + classification logic.
2. Implement D1-backed cache read/write path with TTL policy.
3. Add route-level tests for batch and individual endpoints.

## Tooling Follow-Up

1. Add Lighthouse/PWA checks to CI for installability and offline baseline validation.
2. Add component/template complexity guardrails to lint or PR checklist.
3. Add store-convention checklist (state shape, persistence, action-log tests) to PR template.
