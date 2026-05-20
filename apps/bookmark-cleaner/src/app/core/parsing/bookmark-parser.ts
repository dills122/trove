import {
  type BookmarkFolder,
  type BookmarkLink,
  type BookmarkWorkspaceSnapshot,
  type CountSummary,
  type ParseWarning,
} from '../models/bookmark.models';
import { getHost, getRegistrableDomain, getScheme } from '../utils/domain-analysis';
import { deriveTitleFromUrl } from '../utils/title-derive';
import { getDomain, normalizeUrl } from '../utils/url-normalization';

const TOKEN_REGEX = /<DT><H3\b[^>]*>([\s\S]*?)<\/H3>|<DT><A\b([^>]*)>([\s\S]*?)<\/A>|<DL><p>|<\/DL>/gi;
const HREF_ATTR_REGEX = /HREF="([^"]*)"/i;

const stripHtml = (input: string): string => input.replace(/<[^>]+>/g, '').trim();

const createRootFolder = (): BookmarkFolder => ({
  id: 'root',
  type: 'folder',
  title: 'Imported Bookmarks',
  path: [],
  children: [],
});

const createFolder = (title: string, path: string[], index: number): BookmarkFolder => ({
  id: `folder-${index}`,
  type: 'folder',
  title,
  path,
  children: [],
});

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
    const [fullMatch, folderTitleMatch, anchorAttrsMatch, anchorTextMatch] = token;

    if (fullMatch === '<DL><p>') {
      if (pendingFolder) {
        folderStack.push(pendingFolder);
        pendingFolder = null;
      }
      continue;
    }

    if (fullMatch === '</DL>') {
      if (folderStack.length > 1) {
        folderStack.pop();
      }
      continue;
    }

    if (typeof folderTitleMatch === 'string') {
      folderCount += 1;
      const title = stripHtml(folderTitleMatch) || `Folder ${folderCount}`;
      const parent = folderStack[folderStack.length - 1];
      const folder = createFolder(title, [...parent.path, title], folderCount);
      parent.children.push(folder);
      pendingFolder = folder;
      continue;
    }

    if (typeof anchorAttrsMatch === 'string') {
      linkCount += 1;

      const hrefMatch = HREF_ATTR_REGEX.exec(anchorAttrsMatch);
      const url = hrefMatch?.[1]?.trim();
      const rawTitle = stripHtml(anchorTextMatch ?? '');

      if (!url) {
        malformedEntries += 1;
        warnings.push({ code: 'MISSING_URL', message: `Entry #${linkCount} missing URL` });
        continue;
      }

      const title = rawTitle || deriveTitleFromUrl(url);
      if (!rawTitle) {
        warnings.push({ code: 'MISSING_TITLE', message: `Derived title for ${url}` });
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
      const bookmark: BookmarkLink = {
        id: `link-${linkCount}`,
        type: 'link',
        title,
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
