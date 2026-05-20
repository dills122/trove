import { describe, expect, it } from '@jest/globals';
import { parseBookmarkHtml } from './bookmark-parser';

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
    expect(result.bookmarks[0].title).toBe('start');
    expect(result.warnings.some((warning) => warning.code === 'MISSING_TITLE')).toBe(true);
  });
});
