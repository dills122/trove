import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseBookmarkHtml } from './bookmark-parser';

describe('parseBookmarkHtml fixture', () => {
  it('parses a real-world bookmark export without crashing', () => {
    const fixturePath = resolve(
      process.cwd(),
      'src/app/testing/fixtures/bookmarks-sample.html',
    );
    const html = readFileSync(fixturePath, 'utf8');

    const result = parseBookmarkHtml(html);

    expect(result.analysis.totalBookmarks).toBeGreaterThan(100);
    expect(result.analysis.uniqueUrls).toBeGreaterThan(100);
    expect(result.originalTree.children.length).toBeGreaterThan(100);
  });
});
