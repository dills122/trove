import { describe, expect, it } from '@jest/globals';
import { deriveTitleFromUrl } from './title-derive';

describe('deriveTitleFromUrl', () => {
  it('uses final path segment when available', () => {
    expect(deriveTitleFromUrl('https://example.com/docs/getting-started')).toBe('getting-started');
  });

  it('falls back to domain', () => {
    expect(deriveTitleFromUrl('https://example.com/')).toBe('example.com');
  });
});
