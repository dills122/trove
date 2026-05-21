import type { BookmarkLink } from '../models/bookmark.models';
import { calculateDuplicateMetrics } from './duplicate-metrics';

const makeBookmark = (overrides: Partial<BookmarkLink>): BookmarkLink => ({
  id: overrides.id ?? 'id-1',
  title: overrides.title ?? 'Example',
  url: overrides.url ?? 'https://example.com',
  normalizedUrl: overrides.normalizedUrl ?? 'https://example.com/',
  host: overrides.host ?? 'example.com',
  registrableDomain: overrides.registrableDomain ?? 'example.com',
  path: overrides.path ?? ['Bookmarks bar'],
  addedAt: overrides.addedAt ?? null,
  icon: overrides.icon ?? null,
});

describe('calculateDuplicateMetrics', () => {
  it('returns zeroed metrics for empty collections', () => {
    const metrics = calculateDuplicateMetrics([]);

    expect(metrics.groups).toEqual([]);
    expect(metrics.linksCount).toBe(0);
    expect(metrics.exactGroupCount).toBe(0);
    expect(metrics.hostTitleGroupCount).toBe(0);
    expect(metrics.potentialRemovals).toBe(0);
    expect(metrics.largestGroupSize).toBe(0);
  });

  it('computes counts from duplicate groups', () => {
    const bookmarks: BookmarkLink[] = [
      makeBookmark({ id: '1', title: 'Docs', url: 'https://angular.dev', normalizedUrl: 'https://angular.dev/' }),
      makeBookmark({ id: '2', title: 'Docs', url: 'https://angular.dev/', normalizedUrl: 'https://angular.dev/' }),
      makeBookmark({ id: '3', title: 'Guide', url: 'https://dev.to/post-a', normalizedUrl: 'https://dev.to/post-a' }),
      makeBookmark({ id: '4', title: 'Guide', url: 'https://dev.to/post-b', normalizedUrl: 'https://dev.to/post-b' }),
      makeBookmark({ id: '5', title: 'Unique', url: 'https://example.org', normalizedUrl: 'https://example.org/' }),
    ];

    const metrics = calculateDuplicateMetrics(bookmarks);

    expect(metrics.groups.length).toBe(2);
    expect(metrics.exactGroupCount).toBe(1);
    expect(metrics.hostTitleGroupCount).toBe(1);
    expect(metrics.linksCount).toBe(4);
    expect(metrics.potentialRemovals).toBe(2);
    expect(metrics.largestGroupSize).toBe(2);
  });
});
