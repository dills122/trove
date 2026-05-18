import {
  type BookmarkFolder,
  type BookmarkLink,
  type BookmarkWorkspaceSnapshot,
  type ParseWarning,
} from '../models/bookmark.models';
import { deriveTitleFromUrl } from '../utils/title-derive';
import { getDomain, normalizeUrl } from '../utils/url-normalization';

const FOLDER_REGEX = /<H3[^>]*>(.*?)<\/H3>/gi;
const LINK_REGEX = /<A\s+[^>]*HREF="([^"]+)"[^>]*>(.*?)<\/A>/gi;

const stripHtml = (input: string): string => input.replace(/<[^>]+>/g, '').trim();

const createRootFolder = (): BookmarkFolder => ({
  id: 'root',
  type: 'folder',
  title: 'Imported Bookmarks',
  path: [],
  children: [],
});

export const parseBookmarkHtml = (html: string): BookmarkWorkspaceSnapshot => {
  const warnings: ParseWarning[] = [];
  const bookmarks: BookmarkLink[] = [];
  const root = createRootFolder();

  let folderCount = 0;
  let folderMatch: RegExpExecArray | null;
  while ((folderMatch = FOLDER_REGEX.exec(html)) !== null) {
    folderCount += 1;
    const title = stripHtml(folderMatch[1]) || `Folder ${folderCount}`;
    root.children.push({
      id: `folder-${folderCount}`,
      type: 'folder',
      title,
      path: [title],
      children: [],
    });
  }

  let linkCount = 0;
  let malformedEntries = 0;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = LINK_REGEX.exec(html)) !== null) {
    linkCount += 1;
    const url = linkMatch[1]?.trim();
    const rawTitle = stripHtml(linkMatch[2] ?? '');

    if (!url) {
      malformedEntries += 1;
      warnings.push({ code: 'MISSING_URL', message: `Entry #${linkCount} missing URL` });
      continue;
    }

    const title = rawTitle || deriveTitleFromUrl(url);
    if (!rawTitle) {
      warnings.push({ code: 'MISSING_TITLE', message: `Derived title for ${url}` });
    }

    const bookmark: BookmarkLink = {
      id: `link-${linkCount}`,
      type: 'link',
      title,
      url,
      normalizedUrl: normalizeUrl(url),
      domain: getDomain(url),
      path: [],
      tags: [],
    };

    bookmarks.push(bookmark);
    root.children.push(bookmark);
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
    },
  };
};
