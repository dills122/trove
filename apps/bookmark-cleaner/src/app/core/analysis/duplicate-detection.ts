import type { BookmarkLink } from '../models/bookmark.models';

export interface DuplicateGroup {
  id: string;
  reason: 'NORMALIZED_URL' | 'HOST_AND_TITLE';
  key: string;
  items: BookmarkLink[];
}

const normalizeTitle = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const detectDuplicateGroups = (bookmarks: BookmarkLink[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];
  const groupedByNormalizedUrl = new Map<string, BookmarkLink[]>();
  const groupedByHostAndTitle = new Map<string, BookmarkLink[]>();
  const assigned = new Set<string>();

  for (const bookmark of bookmarks) {
    const urlKey = bookmark.normalizedUrl;
    groupedByNormalizedUrl.set(urlKey, [...(groupedByNormalizedUrl.get(urlKey) ?? []), bookmark]);

    const hostTitleKey = `${bookmark.host}::${normalizeTitle(bookmark.title)}`;
    groupedByHostAndTitle.set(hostTitleKey, [
      ...(groupedByHostAndTitle.get(hostTitleKey) ?? []),
      bookmark,
    ]);
  }

  for (const [key, items] of groupedByNormalizedUrl.entries()) {
    if (items.length < 2) {
      continue;
    }

    for (const item of items) {
      assigned.add(item.id);
    }

    groups.push({
      id: `url:${key}`,
      reason: 'NORMALIZED_URL',
      key,
      items,
    });
  }

  for (const [key, items] of groupedByHostAndTitle.entries()) {
    const unassigned = items.filter((item) => !assigned.has(item.id));
    if (unassigned.length < 2) {
      continue;
    }

    groups.push({
      id: `host-title:${key}`,
      reason: 'HOST_AND_TITLE',
      key,
      items: unassigned,
    });
  }

  return groups.sort((a, b) => b.items.length - a.items.length);
};
