import { describe, expect, it } from '@jest/globals';
import { normalizeUrl } from './url-normalization';

describe('normalizeUrl', () => {
  it('removes tracking params and hash', () => {
    const result = normalizeUrl('https://Example.com/path?utm_source=x&keep=1#fragment');
    expect(result).toBe('https://example.com/path?keep=1');
  });

  it('keeps protocol differences', () => {
    const http = normalizeUrl('http://example.com/a');
    const https = normalizeUrl('https://example.com/a');
    expect(http).not.toBe(https);
  });
});
