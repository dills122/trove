Below is a full MVP tech design you could turn into `TECH_DESIGN.md`.

# Bookmark Utility MVP Tech Design

## 1. Product summary

A local-first Angular PWA for importing, analyzing, cleaning, categorizing, health-checking, and exporting browser bookmarks.

The app should help users take a messy Chrome bookmark export and turn it into a cleaner, deduplicated, categorized bookmark structure without automatically modifying their browser data.

## 2. MVP goals

The MVP should support:

```txt
Import Chrome bookmark HTML
Parse bookmarks using Web Workers
Store workspace locally
Show bookmark metadata and stats
Detect duplicates
Detect empty/overloaded folders
Normalize URLs
Suggest categories
Suggest an organized folder tree
Run optional batched link health checks through Cloudflare
Preview proposed changes
Export cleaned Chrome-compatible bookmark HTML
```

## 3. Non-goals for MVP

Do not include yet:

```txt
User accounts
Browser extension
Automatic Chrome bookmark syncing
Automatic bookmark deletion
AI categorization
Scheduled background checks
Shared public site database
Team/workspace features
Full text indexing of page contents
```

## 4. Core architecture

```txt
Angular PWA
  ├─ UI shell
  ├─ Signals-based workspace store
  ├─ IndexedDB local persistence
  ├─ Bookmark engine Web Worker
  ├─ Cloudflare Worker API client
  └─ Export/download flow

Cloudflare
  ├─ Worker API
  ├─ D1 health cache
  └─ Optional Queues later
```

## 5. Frontend stack

Use:

```txt
Angular
Angular Material
Tailwind
Angular Signals
Angular PWA/service worker
Dexie for IndexedDB
tldts for domain parsing
zod for validation
Jest for unit tests
Playwright later for e2e
```

## 6. Backend stack

Use Cloudflare for MVP health checks.

```txt
Cloudflare Workers
Cloudflare D1
Wrangler
```

Cloudflare is a good fit for the MVP/free-tier use case. Workers Free currently lists 100,000 requests/day, D1 Free lists 5 GB account storage with 500 MB max DB size, and Queues Free includes 10,000 operations/day if you add queue-based background processing later. ([Cloudflare Docs][1])

## 7. PWA stance

This is still a PWA.

The product model is:

```txt
Local-first PWA
Cloud-assisted health checks
```

Local/offline features:

```txt
Import
Parse
Analyze
Deduplicate
Categorize
Sort
Preview
Export
```

Cloud-required features:

```txt
Live link health checks
Redirect detection
HTTP status checks
Metadata fetching
Shared site health cache
```

## 8. Angular app structure

```txt
apps/bookmark-cleaner/
  src/app/
    core/
      models/
      services/
      workers/
      storage/
      api/

    features/
      import/
      dashboard/
      duplicates/
      organize/
      health-check/
      export/

    shared/
      components/
        bookmark-tree/
        stat-card/
        folder-path-chip/
        health-status-chip/
        progress-panel/
```

## 9. Routes

```ts
export const routes: Routes = [
  { path: "", redirectTo: "import", pathMatch: "full" },
  { path: "import", component: ImportPageComponent },
  { path: "dashboard", component: DashboardPageComponent },
  { path: "duplicates", component: DuplicatesPageComponent },
  { path: "organize", component: OrganizePageComponent },
  { path: "health", component: HealthCheckPageComponent },
  { path: "export", component: ExportPageComponent },
];
```

## 10. Web Worker design

Use one MVP worker first:

```txt
bookmark-engine.worker.ts
```

Worker responsibilities:

```txt
Parse Chrome bookmark export HTML
Build bookmark tree
Flatten bookmark links
Normalize URLs
Extract domains
Compute stats
Find duplicates
Apply category rules
Build proposed tree
Generate export HTML
```

Do not use the worker for:

```txt
Actual link health requests
Cloudflare API calls
IndexedDB writes from MVP UI
```

The browser security model still applies inside Web Workers, so they do not solve CORS for arbitrary site checks.

## 11. Worker message contract

```ts
type WorkerRequest =
  | {
      type: "PARSE_BOOKMARK_HTML";
      payload: {
        html: string;
      };
    }
  | {
      type: "ANALYZE_BOOKMARKS";
      payload: {
        root: BookmarkFolder;
      };
    }
  | {
      type: "BUILD_PROPOSED_TREE";
      payload: {
        root: BookmarkFolder;
        rules: CategoryRule[];
        duplicateActions: DuplicateAction[];
      };
    }
  | {
      type: "GENERATE_EXPORT_HTML";
      payload: {
        root: BookmarkFolder;
      };
    };
```

```ts
type WorkerResponse =
  | {
      type: "PARSE_COMPLETE";
      payload: BookmarkWorkspaceSnapshot;
    }
  | {
      type: "ANALYSIS_COMPLETE";
      payload: BookmarkAnalysis;
    }
  | {
      type: "PROPOSED_TREE_COMPLETE";
      payload: BookmarkFolder;
    }
  | {
      type: "EXPORT_HTML_COMPLETE";
      payload: {
        html: string;
      };
    }
  | {
      type: "WORKER_ERROR";
      error: {
        message: string;
        code?: string;
      };
    };
```

## 12. Core data models

```ts
type BookmarkNode = BookmarkFolder | BookmarkLink;

type BookmarkFolder = {
  id: string;
  type: "folder";
  title: string;
  path: string[];
  children: BookmarkNode[];
  dateAdded?: number;
  dateModified?: number;
};

type BookmarkLink = {
  id: string;
  type: "link";
  title: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  registrableDomain?: string;
  path: string[];
  dateAdded?: number;
  icon?: string;
  tags: string[];
  categorySuggestion?: CategorySuggestion;
  health?: LinkHealthResult;
};
```

```ts
type BookmarkAnalysis = {
  totalBookmarks: number;
  totalFolders: number;
  uniqueUrls: number;
  duplicateGroups: DuplicateGroup[];
  emptyFolders: BookmarkFolder[];
  largestFolders: FolderSummary[];
  topDomains: DomainSummary[];
  malformedUrls: BookmarkLink[];
};
```

```ts
type DuplicateGroup = {
  normalizedUrl: string;
  bookmarks: BookmarkLink[];
};
```

```ts
type CategorySuggestion = {
  proposedPath: string[];
  confidence: "high" | "medium" | "low";
  reasons: string[];
};
```

## 13. URL normalization

Normalize for duplicate detection and health cache lookup.

MVP normalization rules:

```txt
lowercase protocol and hostname
remove trailing slash when path is root
remove hash fragment
optionally remove common tracking params
normalize http/https variants as similar, not automatically identical
preserve meaningful query params
```

Tracking params to strip:

```txt
utm_source
utm_medium
utm_campaign
utm_term
utm_content
fbclid
gclid
mc_cid
mc_eid
```

## 14. Local workspace store

Use Angular Signals.

```ts
@Injectable({ providedIn: "root" })
export class BookmarkWorkspaceStore {
  readonly originalTree = signal<BookmarkFolder | null>(null);
  readonly proposedTree = signal<BookmarkFolder | null>(null);
  readonly bookmarks = signal<BookmarkLink[]>([]);
  readonly analysis = signal<BookmarkAnalysis | null>(null);
  readonly healthResults = signal<Record<string, LinkHealthResult>>({});
  readonly isProcessing = signal(false);
}
```

Persist to IndexedDB using Dexie:

```txt
workspaces
bookmarks
health_results
category_rules
settings
```

## 15. MVP screens

### Import page

User can:

```txt
Upload Chrome bookmark HTML
Parse file
See import summary
Continue to dashboard
```

### Dashboard page

Show:

```txt
Total bookmarks
Total folders
Unique URLs
Duplicate count
Empty folders
Top domains
Largest folders
Malformed URLs
```

### Duplicates page

User can:

```txt
Review duplicate groups
Keep all
Mark extras for removal
Choose canonical bookmark
Prefer newest
Prefer shortest folder path
```

### Organize page

User can:

```txt
View original tree
View proposed tree
Review category suggestions
Approve/reject suggested moves
Edit category rules
Rebuild proposed tree
```

### Health check page

User can:

```txt
See unique URLs
Run batch health check
Check selected folder
Check individual URL
Force refresh selected URL
View alive/dead/redirected/timeout/unknown counts
```

### Export page

User can:

```txt
View summary of changes
Download cleaned bookmark HTML
Export original copy
Export proposed clean copy
```

## 16. Health check design

Health checks are manual in MVP.

Prompt language:

```txt
Health checks use a cloud service to visit each URL.
Your bookmark file stays local, but selected URLs are sent for checking.
```

Batch-first flow:

```txt
1. User imports bookmarks
2. App extracts unique normalized URLs
3. User clicks Run Batch Health Check
4. Angular sends URLs in chunks of 25–50
5. Cloudflare checks cache first
6. Cloudflare performs fresh checks when needed
7. Results stream/progressively update in UI
8. Results are saved locally
```

## 17. Cloudflare API

### Batch check

```txt
POST /api/link-health/batch
```

Request:

```ts
type LinkHealthBatchRequest = {
  urls: string[];
  options?: {
    forceRefresh?: boolean;
    includeMetadata?: boolean;
    timeoutMs?: number;
  };
};
```

Response:

```ts
type LinkHealthBatchResponse = {
  results: LinkHealthResult[];
  summary: {
    total: number;
    fresh: number;
    cached: number;
    failed: number;
  };
};
```

### Individual check

```txt
GET /api/link-health?url=https://example.com
```

Use this for:

```txt
Recheck this link
Check manually added URL
Debug one failed URL
```

## 18. Link health result model

```ts
type LinkHealthResult = {
  url: string;
  normalizedUrl: string;
  finalUrl?: string;
  statusCode?: number;
  status:
    | "alive"
    | "redirected"
    | "dead"
    | "timeout"
    | "blocked"
    | "auth-required"
    | "unknown";
  checkedAt: string;
  source: "fresh-check" | "cache";
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    contentType?: string;
  };
};
```

## 19. Backend health check behavior

For each URL:

```txt
Normalize URL
Check D1 cache
If recent result exists, return cached
Try HEAD request
If HEAD fails or unsupported, fallback to GET
Follow redirects
Apply timeout
Classify response
Store result in D1
Return result
```

Recommended classification:

```txt
2xx = alive
3xx followed successfully = redirected
401/403 = auth-required or blocked
404/410 = dead
5xx = unknown or server-error
timeout = timeout
network failure = unknown
```

## 20. Cloudflare D1 schema

```sql
CREATE TABLE link_health (
  normalized_url TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  final_url TEXT,
  status TEXT NOT NULL,
  status_code INTEGER,
  checked_at TEXT NOT NULL,
  error TEXT,
  title TEXT,
  description TEXT,
  content_type TEXT
);

CREATE INDEX idx_link_health_checked_at
ON link_health (checked_at);

CREATE INDEX idx_link_health_status
ON link_health (status);
```

## 21. Privacy model

MVP privacy stance:

```txt
Bookmark file never uploads as a full file
Parsing happens locally
Organization happens locally
Only URLs selected for health checking are sent to Cloudflare
Health results are cached by normalized URL
No user account required
```

## 22. MVP build phases

### Phase 1: Local import engine

```txt
Angular shell
PWA setup
File upload
Worker-based parser
Bookmark tree model
Render imported tree
```

### Phase 2: Analysis

```txt
Flatten bookmarks
Normalize URLs
Compute stats
Top domains
Largest folders
Empty folders
Malformed URLs
```

### Phase 3: Duplicates

```txt
Duplicate grouping
Review UI
Bulk duplicate actions
```

### Phase 4: Categorization and organization

```txt
Rule-based categories
Proposed folder tree
Original vs proposed preview
Approve/reject moves
```

### Phase 5: Export

```txt
Generate Chrome-compatible bookmark HTML
Download cleaned export
Validate import compatibility
```

### Phase 6: Cloudflare health checks

```txt
Worker API
D1 cache
Batch endpoint
Individual endpoint
Angular health check page
Local result persistence
```

## 23. Post-MVP goals

### V1.5

```txt
Better category rules editor
Folder-level health checks
Metadata enrichment
Favicon fetching
Import history
Export presets
Undo/redo organization changes
```

### V2

```txt
Cloudflare Queues for background checks
Scheduled rechecks
Shared URL health database
Stale result refresh policy
User accounts
Multiple workspaces
Saved cleanup profiles
```

### V3

```txt
Browser extension
Read bookmarks directly with permission
Suggest changes without requiring export/import
Optional Chrome bookmark write-back
AI-assisted categorization
Semantic clustering
Page content summarization
Dead-link replacement suggestions
```

### V4

```txt
Collaborative/shared bookmark libraries
Public site index
Personal web archive snapshots
Read-it-later integration
Raindrop/Pocket/Pinboard import
Cross-browser support
```

## 24. Main product principle

The app should never feel destructive.

The core UX should be:

```txt
Import safely
Analyze locally
Suggest clearly
Preview everything
Export only when approved
```

Best MVP name for the architecture:

```txt
Local-first bookmark cleanup PWA with cloud-assisted link health checks
```

[1]: https://developers.cloudflare.com/workers/platform/limits/?utm_source=chatgpt.com "Limits · Cloudflare Workers docs"
