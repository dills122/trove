import type { BookmarkLink } from '../models/bookmark.models';
import { detectDuplicateGroups } from './duplicate-detection';

const createLink = (overrides: Partial<BookmarkLink> = {}): BookmarkLink => ({
  id: overrides.id ?? `id-${Math.random().toString(36).slice(2)}`,
  type: 'link',
  title: overrides.title ?? 'Example',
  url: overrides.url ?? 'https://example.com',
  normalizedUrl: overrides.normalizedUrl ?? 'https://example.com',
  domain: overrides.domain ?? 'example.com',
  host: overrides.host ?? 'example.com',
  registrableDomain: overrides.registrableDomain ?? 'example.com',
  scheme: overrides.scheme ?? 'https',
  path: overrides.path ?? [],
  tags: overrides.tags ?? [],
});

describe('detectDuplicateGroups', () => {
  it('groups duplicates by normalized URL first', () => {
    const groups = detectDuplicateGroups([
      createLink({ id: '1', normalizedUrl: 'https://example.com/a' }),
      createLink({ id: '2', normalizedUrl: 'https://example.com/a' }),
      createLink({ id: '3', normalizedUrl: 'https://example.com/b' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.reason).toBe('NORMALIZED_URL');
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('falls back to host+title duplicate grouping for unassigned entries', () => {
    const groups = detectDuplicateGroups([
      createLink({ id: '1', host: 'docs.example.com', title: 'Read Me', normalizedUrl: 'https://docs.example.com/a' }),
      createLink({ id: '2', host: 'docs.example.com', title: 'read   me', normalizedUrl: 'https://docs.example.com/b' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.reason).toBe('HOST_AND_TITLE');
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['1', '2']);
  });
});
