export type BookmarkNode = BookmarkFolder | BookmarkLink;

export interface BookmarkFolder {
  id: string;
  type: 'folder';
  title: string;
  path: string[];
  children: BookmarkNode[];
}

export interface BookmarkLink {
  id: string;
  type: 'link';
  title: string;
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
  code: 'MISSING_URL' | 'MISSING_TITLE' | 'MALFORMED_ENTRY';
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
  originalTree: BookmarkFolder;
  bookmarks: BookmarkLink[];
  analysis: BookmarkAnalysis;
  warnings: ParseWarning[];
}
