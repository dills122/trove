# Bookmark Utility MVP Workplan

## Goals

- Deliver a local-first bookmark cleanup MVP using Angular + Web Worker + IndexedDB.
- Add cloud-assisted link health checks through Cloudflare Worker + D1.
- Keep all destructive actions preview-first and export-only.

## Phase Plan

1. Phase 1: Local import engine
- Route shell
- File upload + parse invocation
- Worker parser scaffolding
- Imported tree render baseline

2. Phase 2: Analysis
- Flatten bookmarks
- URL normalization
- Stats and dashboard summaries

3. Phase 3: Duplicates
- Group duplicates
- Bulk action model
- Duplicates review UI

4. Phase 4: Organization
- Rule-based categories
- Proposed tree generation
- Approve/reject move flows

5. Phase 5: Export
- Generate Chrome-compatible HTML
- Export original/proposed variants

6. Phase 6: Health checks
- Worker batch + individual endpoints
- D1 caching behavior
- Health page integration and local persistence
