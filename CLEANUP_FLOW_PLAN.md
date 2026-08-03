# Trove Cleanup Flow And Cleaner Plan

Status: proposed source of truth for the remaining local cleanup, organization, preview, and export work.
The repository steering files take precedence if this plan conflicts with them.

## 1. Product Flow

Keep the product to four user-facing steps:

1. **Import** — validate and parse a bookmark export into an immutable source snapshot.
2. **Review** — explain the collection, warnings, duplicate candidates, and cleanup opportunities.
3. **Clean** — review cleaner proposals, organize folders, and record reversible decisions.
4. **Export** — inspect the projected result, choose export-only options, and download original or cleaned HTML.

The existing `/organize` route can remain while the UI label changes from **Organize** to **Clean**. This better
describes duplicate, URL, title, and folder work without requiring route churn during MVP.

Health checking is an optional, consent-gated source of evidence inside Review and Clean. It is not a required
fifth step and must never block local import, analysis, cleanup, organization, or export.

### Core lifecycle

```text
validated import
  -> immutable source snapshot + source revision
  -> deterministic local analysis
  -> cleaner proposals
  -> accepted/rejected/modified decisions
  -> projected tree and impact summary
  -> shared materializer
  -> preview or serialized export
```

Preview and final export must call the same materializer with the same source revision, accepted decisions, and
export options. No Clean action mutates `originalTree`.

## 2. Step Behavior

### Step 1: Import

- Validate file bounds and format before reading the complete payload.
- Parse in a worker and create a stable source revision.
- Preserve imported values separately from derived display values and normalized comparison keys.
- Start a new cleanup session for a new source revision. If the active session has decisions, warn before replacing
  it and keep the previous snapshot recoverable until the new import commits.
- Allow the original snapshot to be exported as soon as import succeeds.

### Step 2: Review

- Show source facts only: counts, warnings, folder shape, schemes, domains, and cleanup opportunity counts.
- Distinguish deterministic matches from suggestions:
  - exact duplicates: identical deterministic comparison keys
  - possible duplicates: protocol, title, host, or later health-result evidence
- Link each actionable metric to the matching Clean queue.
- Offer an optional health-check action only after explicit consent and an exact URL-set preview.

### Step 3: Clean

Use one page shell with five focused queues:

1. **Overview** — remaining suggestions, accepted changes, projected totals, and undo/redo.
2. **Duplicates** — exact groups first, then possible groups requiring individual review.
3. **Links** — tracking-parameter, title, redirect, protocol, and health-result proposals.
4. **Folders** — empty folders, duplicate sibling folders, manual moves, and category rules.
5. **Changes** — accepted, rejected, skipped, superseded, and conflicted proposals.

Each queue must support search/filter, a meaningful empty state, stable focus after a decision, and an accessible
status summary. A sticky or persistent impact summary should show at least:

- links before and projected after
- accepted removals, URL edits, title edits, and moves
- unresolved suggestions and conflicts
- undo/redo availability

Bulk actions are limited to homogeneous, deterministic proposal sets. They always show an impact confirmation and
create one undoable history entry. Possible duplicates and cloud-derived destructive actions have no silent bulk
accept path.

### Step 4: Export

- Show a concise before/after summary and unresolved conflict count.
- Provide a change list as the primary comparison. Offer Original/Projected tree views as a secondary inspection
  tool; do not require users to understand two dense side-by-side trees to approve an export.
- Generate both **Original snapshot** and **Cleaned** exports.
- Keep export-only structural choices, such as pruning newly empty folders, explicit and included in the preview.
- Serialize untrusted text with a format-aware escaper and round-trip the result through parser fixtures.
- Export remains available when offline.

## 3. Cleaner Architecture

A cleaner is a pure proposal generator. It does not mutate a tree, persist decisions, or serialize output.

```ts
interface CleanerDefinition<TConfig> {
  id: CleanerId;
  version: number;
  category: 'duplicates' | 'links' | 'titles' | 'folders' | 'health';
  evidence: 'local' | 'cloud-assisted';
  propose(context: CleanerContext, config: TConfig): CleanerProposal[];
}
```

Every proposal must include:

- a stable ID derived from cleaner version, source revision, target IDs, and relevant configuration
- the affected node IDs and source values
- a typed patch (`remove-link`, `update-url`, `rename-link`, `move-node`, `merge-folder`, or `remove-folder`)
- evidence and a short user-facing reason
- confidence (`exact`, `strong`, or `possible`) and impact (`non-destructive`, `content-changing`, or `removal`)
- dependencies, conflicts, and whether bulk review is permitted

Proposal review state is separate from the proposal:

- `unreviewed`
- `accepted`
- `rejected`
- `modified` — the user accepted a user-edited patch
- `skipped` — intentionally left unchanged without rejecting the cleaner generally
- `superseded` — another accepted proposal makes this proposal irrelevant
- `conflicted` — accepted patches cannot be materialized together and require review

Persist domain decisions and a history cursor, not mutated trees. Undo and redo move the cursor across decision
batches. Replaying the same source revision, cleaner versions, configuration, and decisions must produce the same
projected result.

## 4. MVP Cleaner Catalog

| Cleaner | Evidence and proposal | Review policy | MVP phase |
| --- | --- | --- | --- |
| Exact duplicates | Same deterministic normalized comparison key; propose retaining selected IDs and removing the rest | Per-group review; bulk only for exact groups after impact confirmation | First |
| Possible duplicates | Protocol variants or strong same-host/title similarity; later may include final-URL evidence | Individual review only; never preaccepted | First |
| Known tracking parameters | Remove only an explicit, tested allowlist such as `utm_*`, `fbclid`, and `gclid`; show every removed key and resulting URL | Per-link, per-domain, or reviewed batch; acceptance updates export URL only | Second |
| Missing title | Preserve the imported empty title, propose the existing deterministic derived title, and allow editing | Individual or reviewed batch acceptance | Second |
| Empty folders | Propose removal only after all accepted link removals and moves are projected | Export option with exact count and tree preview | Third |
| Duplicate sibling folders | Same normalized folder title under the same parent; propose merging children while preserving order | Individual review; show source paths and resulting folder | Third |
| Domain category rules | User-authored exact host or registrable-domain rule proposes moves to a chosen folder path | Preview all matches before saving or applying; first enabled match by priority wins | Third |
| Manual move/rename | User directly creates a typed move or rename decision from the tree/change UI | Immediate decision, fully undoable | Third |
| Dead-link removal | Successful opt-in health run classifies URL as dead under documented policy | Individual review; no automatic removal | Cloud assist |
| Redirect target update | Successful opt-in health run provides an allowed final HTTP(S) URL | Individual review with old/new URL and redirect evidence | Cloud assist |
| Evidence-backed HTTPS upgrade | Health evidence proves the HTTPS destination rather than assuming equivalence | Individual review, or later reviewed domain batch | Cloud assist |

### Important semantic boundaries

- URL normalization used for comparison is not permission to rewrite an export URL. Fragment removal, trailing-slash
  normalization, query sorting, or host/protocol changes require a separate accepted proposal.
- Bookmarklets and non-HTTP schemes are inventoried and rendered as inert text. They are preserved by default and
  never opened or executed by Trove.
- Missing-URL entries currently become import warnings and are skipped. They cannot be a cleanup queue until the
  parser preserves enough bounded source data to review them safely.
- `http` and `https` remain distinct without an explicit user decision or health-check evidence.
- Generic query-parameter removal, semantic/AI categorization, cross-domain redirect auto-acceptance, and automatic
  browser writeback are post-MVP.

## 5. Duplicate Decision Behavior

Each group supports:

- keep first in source order
- keep newest or oldest when valid imported timestamps are available
- keep selected
- remove selected
- keep all / skip
- reset group

The UI must show title, original URL, folder path, available timestamps, and metadata differences. If timestamps are
missing or invalid, newest/oldest controls are unavailable rather than guessed.

For bulk exact-group review, the user chooses one deterministic strategy, sees affected group/link counts, confirms,
and receives one undoable decision batch. Possible groups do not participate in this MVP bulk action.

## 6. Folder Rule Behavior

MVP category rules deliberately use narrow, explainable matching:

- `host-is`
- `registrable-domain-is`

Each rule has an ID, enabled flag, priority, matcher, destination folder path, and creation/update timestamps. Rules
are stored globally but their proposals belong to a specific source revision. The first enabled matching rule wins;
ties are resolved by stable rule ID. Saving a rule never silently accepts its move proposals.

Title keywords, regexes, semantic categories, and multi-condition rule builders are deferred until exact domain rules
have proven useful.

## 7. Materialization And Conflict Rules

The materializer receives an immutable source snapshot, source revision, accepted decisions, and export options.
It must:

1. validate the source revision and every target ID
2. resolve explicit conflicts and reject a materialization with unresolved accepted conflicts
3. determine retained links; an accepted removal supersedes edits and moves for that link
4. apply accepted URL/title edits to retained links
5. apply folder creation, merge, rename, and move decisions in stable order
6. remove accepted links while preserving the relative order of retained nodes
7. prune empty folders last when the export option is enabled
8. recompute projected analysis from the materialized tree

New folders are appended in deterministic rule/decision order unless a future decision adds explicit placement.
Cleaner upgrades that would change existing proposal IDs or meaning require a version bump and decision migration or
visible re-review.

## 8. Required Model And Infrastructure Work

The current app needs these prerequisites before the cleaner UI can be considered complete:

- Add a source/schema revision and preserve imported title separately from derived display title.
- Parse and retain valid `ADD_DATE`/`LAST_MODIFIED` values so newest/oldest strategies are honest.
- Add node-addressable warnings and enough safe Netscape metadata for compatible original/cleaned serialization.
- Add versioned worker envelopes with request ID, progress, success/error, cancellation, and operations for analyze,
  propose, materialize-preview, and serialize-export.
- Move duplicate and cleaner computation out of route-component computed signals and behind the worker service.
- Add `OrganizeStore` for proposals, decision batches, history cursor, filters, and projected impact.
- Persist source snapshot and cleanup session separately in an additive IndexedDB schema migration.
- Add an `/export` route and make the fourth workflow step navigable.
- Add a reset/local-data deletion path and recoverable handling for persistence failure or quota exhaustion.

Suggested feature layout:

```text
core/cleaning/
  cleaner-contracts.ts
  proposal-engine.ts
  decision-reducer.ts
  materialize-tree.ts
  cleaners/
core/export/
  bookmark-exporter.ts
features/organize/
  organize.store.ts
  duplicates/
  links/
  folders/
  changes/
features/export/
```

## 9. Implementation Slices

### Slice 0: Contracts and snapshot correctness

- Version the workspace schema and worker protocol.
- Preserve source values, timestamps, stable node IDs, and source revision.
- Introduce proposal, patch, decision-batch, and materialization contracts.
- Add migration, protocol, determinism, and immutable-source tests.

Exit: the same import creates stable IDs/revision and can persist/reload source plus an empty cleanup session.

### Slice 1: Exact duplicate vertical slice

- Compute duplicate proposals in the worker.
- Implement `OrganizeStore`, per-group strategies, projected impact, persistence, undo, and redo.
- Replace the organize placeholder with accessible duplicate review and a Changes queue.
- Add the first materializer path for retained/removed links.

Exit: exact duplicate decisions survive refresh, never mutate source, and deterministically change preview counts.

### Slice 2: URL and title cleaners

- Add known-tracking-parameter proposals and missing-title proposals.
- Add modified decisions for edited titles/URLs and conflict handling with removed links.
- Expand projected analysis and change summaries.

Exit: accepted edits appear identically in preview and serialized fixture output.

### Slice 3: Folder organization

- Add manual moves, duplicate sibling-folder merge, domain rules, and proposed folder creation.
- Apply stable rule priority and add empty-folder cleanup as a final export option.
- Add accessible list/tree inspection and rule-match previews.

Exit: moves/merges replay deterministically, preserve retained-node order, and remain fully undoable.

### Slice 4: Export completion

- Add the Export route, before/after summary, original/cleaned downloads, and HTML serializer.
- Use the shared materializer for preview and export.
- Add realistic and adversarial parser -> decisions -> serializer -> parser round-trip fixtures.

Exit: exported HTML imports with preserved folder shape, source values, bookmarklets, and accepted changes.

### Slice 5: Opt-in health cleaners

- Add consent and URL-set preview, typed batch results, local persistence, and retry/offline states.
- Generate dead-link, redirect, and HTTPS proposals only from fresh documented evidence.
- Keep all cloud-assisted destructive decisions individually reviewable.

Exit: disabling consent stops transmission without affecting local cleanup or export.

## 10. Quality Gates For Every Slice

- Unit tests cover proposal generation, decision replay, conflicts, and materialization success/failure.
- Worker tests cover progress, malformed messages, cancellation, timeout/termination, and errors.
- Route/store integration tests cover refresh recovery, persistence failure, empty states, and undo/redo.
- Accessibility checks cover keyboard group review, bulk confirmation, status announcements, focus restoration, and
  tree/list semantics without relying on color or indentation alone.
- Large-fixture work remains off the UI thread and stays within a documented performance budget.
- Final repository gates pass through Rush: build, lint, test, and typecheck.

## 11. MVP Completion Definition

Trove's local cleanup MVP is complete when a user can import a supported bookmark file, understand the findings,
review duplicate/link/folder proposals, undo or redo any decision, reload without losing the session, inspect the
projected result, and export original or cleaned browser-compatible HTML entirely offline. The source snapshot remains
unchanged, and the exported result is reproducible from that snapshot plus the persisted decisions.
