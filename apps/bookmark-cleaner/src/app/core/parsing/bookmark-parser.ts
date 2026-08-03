import {
  BOOKMARK_SNAPSHOT_SCHEMA_VERSION,
  type BookmarkFolder,
  type BookmarkLink,
  type BookmarkWorkspaceSnapshot,
  type CountSummary,
  type ParseWarning,
} from '../models/bookmark.models';
import { getHost, getRegistrableDomain, getScheme } from '../utils/domain-analysis';
import { deriveTitleFromUrl } from '../utils/title-derive';
import { getDomain, normalizeUrl } from '../utils/url-normalization';
import { createBookmarkSourceRevision } from './bookmark-source-revision';

const TOKEN_REGEX =
  /<DT>\s*<H3\b([^>]*)>([\s\S]*?)<\/H3>|<DT>\s*<A\b([^>]*)>([\s\S]*?)<\/A>|<DL>\s*<p>|<\/DL>/gi;
const ATTRIBUTE_VALUE_REGEX = (name: string): RegExp =>
  new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`, 'i');

const stripHtml = (input: string): string => input.replace(/<[^>]+>/g, '').trim();

const createRootFolder = (): BookmarkFolder => ({
  id: 'root',
  type: 'folder',
  importedTitle: null,
  displayTitle: 'Imported Bookmarks',
  title: 'Imported Bookmarks',
  addedAt: null,
  lastModifiedAt: null,
  path: [],
  children: [],
});

const createFolder = (
  importedTitle: string | null,
  displayTitle: string,
  path: string[],
  index: number,
  addedAt: string | null,
  lastModifiedAt: string | null,
): BookmarkFolder => ({
  id: `folder-${index}`,
  type: 'folder',
  importedTitle,
  displayTitle,
  title: displayTitle,
  addedAt,
  lastModifiedAt,
  path,
  children: [],
});

const getAttributeValue = (attributes: string, name: string): string | undefined => {
  const match = ATTRIBUTE_VALUE_REGEX(name).exec(attributes);
  return match?.[1] ?? match?.[2] ?? match?.[3];
};

const parseNetscapeTimestamp = (
  attributes: string,
  attributeName: 'ADD_DATE' | 'LAST_MODIFIED',
  entryLabel: string,
  warnings: ParseWarning[],
): string | null => {
  const rawValue = getAttributeValue(attributes, attributeName);
  if (rawValue === undefined) {
    return null;
  }

  if (!/^\d+$/.test(rawValue)) {
    warnings.push({
      code: 'MALFORMED_METADATA',
      message: `${entryLabel} has invalid ${attributeName} metadata`,
    });
    return null;
  }

  const unixSeconds = Number(rawValue);
  const date = new Date(unixSeconds * 1000);
  if (!Number.isSafeInteger(unixSeconds) || !Number.isFinite(date.getTime())) {
    warnings.push({
      code: 'MALFORMED_METADATA',
      message: `${entryLabel} has invalid ${attributeName} metadata`,
    });
    return null;
  }

  return date.toISOString();
};

const summarizeTop = (map: Map<string, number>, limit = 10): CountSummary[] =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));

export const parseBookmarkHtml = (html: string): BookmarkWorkspaceSnapshot => {
  const warnings: ParseWarning[] = [];
  const bookmarks: BookmarkLink[] = [];
  const root = createRootFolder();
  const folderStack: BookmarkFolder[] = [root];

  const schemeCounts = new Map<string, number>();
  const hostCounts = new Map<string, number>();
  const registrableDomainCounts = new Map<string, number>();

  let folderCount = 0;
  let linkCount = 0;
  let malformedEntries = 0;
  let bookmarkletCount = 0;

  let pendingFolder: BookmarkFolder | null = null;
  let token: RegExpExecArray | null;

  while ((token = TOKEN_REGEX.exec(html)) !== null) {
    const [fullMatch, folderAttrsMatch, folderTitleMatch, anchorAttrsMatch, anchorTextMatch] = token;

    if (/^<DL>/i.test(fullMatch)) {
      if (pendingFolder) {
        folderStack.push(pendingFolder);
        pendingFolder = null;
      }
      continue;
    }

    if (/^<\/DL>/i.test(fullMatch)) {
      if (folderStack.length > 1) {
        folderStack.pop();
      }
      continue;
    }

    if (typeof folderTitleMatch === 'string') {
      folderCount += 1;
      const importedTitle = stripHtml(folderTitleMatch) || null;
      const displayTitle = importedTitle ?? `Folder ${folderCount}`;
      const parent = folderStack[folderStack.length - 1];
      const attributes = folderAttrsMatch ?? '';
      const entryLabel = `Folder #${folderCount}`;
      const folder = createFolder(
        importedTitle,
        displayTitle,
        [...parent.path, displayTitle],
        folderCount,
        parseNetscapeTimestamp(attributes, 'ADD_DATE', entryLabel, warnings),
        parseNetscapeTimestamp(attributes, 'LAST_MODIFIED', entryLabel, warnings),
      );
      parent.children.push(folder);
      pendingFolder = folder;
      continue;
    }

    if (typeof anchorAttrsMatch === 'string') {
      linkCount += 1;

      const url = getAttributeValue(anchorAttrsMatch, 'HREF');
      const importedTitle = stripHtml(anchorTextMatch ?? '') || null;

      if (url === undefined || url.trim().length === 0) {
        malformedEntries += 1;
        warnings.push({ code: 'MISSING_URL', message: `Entry #${linkCount} missing URL` });
        continue;
      }

      const displayTitle = importedTitle ?? deriveTitleFromUrl(url);
      if (!importedTitle) {
        warnings.push({ code: 'MISSING_TITLE', message: `Derived title for entry #${linkCount}` });
      }

      const scheme = getScheme(url);
      const host = getHost(url);
      const registrableDomain = getRegistrableDomain(url);

      if (scheme === 'javascript') {
        bookmarkletCount += 1;
      }

      schemeCounts.set(scheme, (schemeCounts.get(scheme) ?? 0) + 1);
      hostCounts.set(host, (hostCounts.get(host) ?? 0) + 1);
      registrableDomainCounts.set(
        registrableDomain,
        (registrableDomainCounts.get(registrableDomain) ?? 0) + 1,
      );

      const parent = folderStack[folderStack.length - 1];
      const entryLabel = `Entry #${linkCount}`;
      const bookmark: BookmarkLink = {
        id: `link-${linkCount}`,
        type: 'link',
        importedTitle,
        displayTitle,
        title: displayTitle,
        addedAt: parseNetscapeTimestamp(anchorAttrsMatch, 'ADD_DATE', entryLabel, warnings),
        lastModifiedAt: parseNetscapeTimestamp(
          anchorAttrsMatch,
          'LAST_MODIFIED',
          entryLabel,
          warnings,
        ),
        url,
        normalizedUrl: normalizeUrl(url),
        domain: getDomain(url),
        host,
        registrableDomain,
        scheme,
        path: [...parent.path],
        tags: [],
      };

      bookmarks.push(bookmark);
      parent.children.push(bookmark);
    }
  }

  if (bookmarks.length === 0) {
    warnings.push({ code: 'MALFORMED_ENTRY', message: 'No bookmark links found in document' });
    malformedEntries += 1;
  }

  const uniqueUrls = new Set(bookmarks.map((bookmark) => bookmark.normalizedUrl)).size;

  return {
    schemaVersion: BOOKMARK_SNAPSHOT_SCHEMA_VERSION,
    sourceRevision: createBookmarkSourceRevision(html),
    originalTree: root,
    bookmarks,
    warnings,
    analysis: {
      totalBookmarks: bookmarks.length,
      totalFolders: folderCount,
      uniqueUrls,
      malformedEntries,
      warningCount: warnings.length,
      bookmarkletCount,
      schemeBreakdown: summarizeTop(schemeCounts, 8),
      topHosts: summarizeTop(hostCounts, 10),
      topRegistrableDomains: summarizeTop(registrableDomainCounts, 10),
    },
  };
};
