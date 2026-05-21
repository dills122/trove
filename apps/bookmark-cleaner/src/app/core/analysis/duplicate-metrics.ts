import type { BookmarkLink } from '../models/bookmark.models';
import { detectDuplicateGroups, type DuplicateGroup } from './duplicate-detection';

export interface DuplicateMetrics {
  groups: DuplicateGroup[];
  linksCount: number;
  exactGroupCount: number;
  hostTitleGroupCount: number;
  potentialRemovals: number;
  largestGroupSize: number;
}

export const calculateDuplicateMetrics = (bookmarks: BookmarkLink[]): DuplicateMetrics => {
  const groups = detectDuplicateGroups(bookmarks);

  return {
    groups,
    linksCount: groups.reduce((sum, group) => sum + group.items.length, 0),
    exactGroupCount: groups.filter((group) => group.reason === 'NORMALIZED_URL').length,
    hostTitleGroupCount: groups.filter((group) => group.reason === 'HOST_AND_TITLE').length,
    potentialRemovals: groups.reduce((sum, group) => sum + Math.max(0, group.items.length - 1), 0),
    largestGroupSize: groups.reduce((max, group) => Math.max(max, group.items.length), 0),
  };
};
