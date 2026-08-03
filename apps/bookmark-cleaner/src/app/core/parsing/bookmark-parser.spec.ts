import { describe, expect, it } from '@jest/globals';
import { BOOKMARK_SNAPSHOT_SCHEMA_VERSION, type BookmarkNode } from '../models/bookmark.models';
import { parseBookmarkHtml } from './bookmark-parser';

const collectNodeIds = (nodes: BookmarkNode[]): string[] =>
  nodes.flatMap((node) =>
    node.type === 'folder' ? [node.id, ...collectNodeIds(node.children)] : [node.id],
  );

describe('parseBookmarkHtml', () => {
  it('parses bookmark links and computes summary', () => {
    const html = '<DL><p><DT><A HREF="https://example.com/path">Example</A></DT></DL>';
    const result = parseBookmarkHtml(html);
    expect(result.analysis.totalBookmarks).toBe(1);
    expect(result.bookmarks[0].normalizedUrl).toBe('https://example.com/path');
  });

  it('derives title and warns when title is missing', () => {
    const html = '<DT><A HREF="https://example.com/docs/start"></A></DT>';
    const result = parseBookmarkHtml(html);

    expect(result.bookmarks[0].importedTitle).toBeNull();
    expect(result.bookmarks[0].displayTitle).toBe('start');
    expect(result.bookmarks[0].title).toBe('start');
    expect(result.warnings.some((warning) => warning.code === 'MISSING_TITLE')).toBe(true);
  });

  it('keeps an imported title separate from its display title', () => {
    const html = '<DT><A HREF="https://example.com/docs/start">Original title</A></DT>';
    const result = parseBookmarkHtml(html);

    expect(result.bookmarks[0]).toMatchObject({
      importedTitle: 'Original title',
      displayTitle: 'Original title',
      title: 'Original title',
    });
  });

  it('produces stable node IDs and source revision for identical input', () => {
    const html = [
      '<DL><p>',
      '<DT><H3>Docs</H3><DL><p>',
      '<DT><A HREF="https://example.com/a">A</A>',
      '<DT><A HREF="https://example.com/b">B</A>',
      '</DL></DL>',
    ].join('');

    const first = parseBookmarkHtml(html);
    const second = parseBookmarkHtml(html);

    expect(first.schemaVersion).toBe(BOOKMARK_SNAPSHOT_SCHEMA_VERSION);
    expect(first.sourceRevision).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.sourceRevision).toBe(first.sourceRevision);
    expect(collectNodeIds(second.originalTree.children)).toEqual(
      collectNodeIds(first.originalTree.children),
    );
    expect(parseBookmarkHtml(`${html}\n`).sourceRevision).not.toBe(first.sourceRevision);
  });

  it('uses the defined SHA-256 source revision format', () => {
    expect(parseBookmarkHtml('').sourceRevision).toBe(
      'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
