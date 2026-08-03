import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseBookmarkHtml } from './bookmark-parser';

describe('parseBookmarkHtml fixture', () => {
  it('parses a real-world bookmark export without crashing', () => {
    const fixturePath = resolve(process.cwd(), 'src/app/testing/fixtures/bookmarks-sample.html');
    const html = readFileSync(fixturePath, 'utf8');

    const result = parseBookmarkHtml(html);

    expect(result.analysis.totalBookmarks).toBeGreaterThan(100);
    expect(result.analysis.uniqueUrls).toBeGreaterThan(100);
    expect(result.analysis.totalFolders).toBeGreaterThan(20);
    expect(result.originalTree.children.length).toBeGreaterThan(1);
  });

  it('retains valid timestamps and preserves imported URL bytes', () => {
    const fixturePath = resolve(process.cwd(), 'src/app/testing/fixtures/bookmarks-metadata.html');
    const html = readFileSync(fixturePath, 'utf8');

    const result = parseBookmarkHtml(html);
    const folder = result.originalTree.children[0];

    expect(folder).toMatchObject({
      type: 'folder',
      importedTitle: 'Reference',
      addedAt: '2023-11-14T22:13:20.000Z',
      lastModifiedAt: '2023-11-14T22:13:30.000Z',
    });
    expect(result.bookmarks[0]).toMatchObject({
      importedTitle: 'Imported Docs',
      displayTitle: 'Imported Docs',
      url: ' https://Example.com/docs?utm_source=fixture#part ',
      normalizedUrl: 'https://example.com/docs',
      addedAt: '2023-11-14T22:13:40.000Z',
      lastModifiedAt: '2023-11-14T22:13:50.000Z',
    });
  });

  it('leaves missing and malformed metadata unset without guessing', () => {
    const fixturePath = resolve(process.cwd(), 'src/app/testing/fixtures/bookmarks-metadata.html');
    const html = readFileSync(fixturePath, 'utf8');

    const result = parseBookmarkHtml(html);

    expect(result.bookmarks[1]).toMatchObject({
      importedTitle: null,
      displayTitle: 'fallback',
      addedAt: null,
      lastModifiedAt: null,
    });
    expect(result.bookmarks[2]).toMatchObject({
      addedAt: null,
      lastModifiedAt: null,
    });
    expect(result.warnings.filter((warning) => warning.code === 'MALFORMED_METADATA')).toHaveLength(2);
  });
});
