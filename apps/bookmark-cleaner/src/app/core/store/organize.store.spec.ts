import { TestBed } from '@angular/core/testing';
import type { BookmarkLink } from '../models/bookmark.models';
import { OrganizeStore } from './organize.store';

const link = (id: string, normalizedUrl: string, host: string, title: string): BookmarkLink => ({
  id,
  type: 'link',
  title,
  url: normalizedUrl,
  normalizedUrl,
  domain: host,
  host,
  registrableDomain: host,
  scheme: normalizedUrl.startsWith('https') ? 'https' : 'http',
  path: ['Bookmarks bar'],
  tags: [],
});

describe('OrganizeStore', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('initializes groups and applies keep_first strategy', () => {
    const store = TestBed.inject(OrganizeStore);
    store.initializeFromBookmarks([
      link('a', 'https://example.com/a', 'example.com', 'A'),
      link('b', 'https://example.com/a', 'example.com', 'A'),
      link('c', 'https://example.com/c', 'example.com', 'C'),
    ]);

    expect(store.groups().length).toBe(1);

    const groupId = store.groups()[0].id;
    store.applyStrategy(groupId, 'keep_first');

    const decision = store.decisions()[groupId];
    expect(decision.keptIds).toEqual(['a']);
    expect(decision.removedIds).toEqual(['b']);
    expect(store.projectedRemovalCount()).toBe(1);
  });

  it('supports undo and redo', () => {
    const store = TestBed.inject(OrganizeStore);
    store.initializeFromBookmarks([
      link('a', 'https://example.com/a', 'example.com', 'A'),
      link('b', 'https://example.com/a', 'example.com', 'A'),
    ]);

    const groupId = store.groups()[0].id;
    store.applyStrategy(groupId, 'keep_first');
    expect(store.reviewedCount()).toBe(1);

    store.undo();
    expect(store.reviewedCount()).toBe(0);

    store.redo();
    expect(store.reviewedCount()).toBe(1);
  });

  it('supports keepSelected and removeSelected decisions', () => {
    const store = TestBed.inject(OrganizeStore);
    store.initializeFromBookmarks([
      link('a', 'https://example.com/a', 'example.com', 'A'),
      link('b', 'https://example.com/a', 'example.com', 'A'),
      link('c', 'https://example.com/a', 'example.com', 'A'),
    ]);

    const groupId = store.groups()[0].id;

    store.keepSelected(groupId, ['a', 'c']);
    expect(store.decisions()[groupId].keptIds).toEqual(['a', 'c']);
    expect(store.decisions()[groupId].removedIds).toEqual(['b']);

    store.removeSelected(groupId, ['c']);
    expect(store.decisions()[groupId].keptIds).toEqual(['a', 'b']);
    expect(store.decisions()[groupId].removedIds).toEqual(['c']);
  });
});
