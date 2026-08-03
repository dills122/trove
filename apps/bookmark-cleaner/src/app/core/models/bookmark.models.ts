export type BookmarkNode = BookmarkFolder | BookmarkLink;

export const BOOKMARK_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type BookmarkSnapshotSchemaVersion = typeof BOOKMARK_SNAPSHOT_SCHEMA_VERSION;

export interface BookmarkNodeMetadata {
  importedTitle: string | null;
  displayTitle: string;
  /** Compatibility alias for displayTitle while existing consumers migrate. */
  title: string;
  addedAt: string | null;
  lastModifiedAt: string | null;
}

export interface BookmarkFolder extends BookmarkNodeMetadata {
  id: string;
  type: 'folder';
  path: string[];
  children: BookmarkNode[];
}

export interface BookmarkLink extends BookmarkNodeMetadata {
  id: string;
  type: 'link';
  url: string;
  normalizedUrl: string;
  domain: string;
  host: string;
  registrableDomain: string;
  scheme: string;
  path: string[];
  tags: string[];
}

export interface ParseWarning {
  code: 'MISSING_URL' | 'MISSING_TITLE' | 'MALFORMED_ENTRY' | 'MALFORMED_METADATA';
  message: string;
}

export interface CountSummary {
  key: string;
  count: number;
}

export interface BookmarkAnalysis {
  totalBookmarks: number;
  totalFolders: number;
  uniqueUrls: number;
  malformedEntries: number;
  warningCount: number;
  bookmarkletCount: number;
  schemeBreakdown: CountSummary[];
  topHosts: CountSummary[];
  topRegistrableDomains: CountSummary[];
}

export interface BookmarkWorkspaceSnapshot {
  schemaVersion: BookmarkSnapshotSchemaVersion;
  sourceRevision: string;
  originalTree: BookmarkFolder;
  bookmarks: BookmarkLink[];
  analysis: BookmarkAnalysis;
  warnings: ParseWarning[];
}
