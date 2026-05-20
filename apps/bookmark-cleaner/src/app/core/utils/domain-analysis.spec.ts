import { describe, expect, it } from '@jest/globals';
import { getHost, getRegistrableDomain, getScheme } from './domain-analysis';

describe('domain analysis', () => {
  it('extracts host and registrable domain', () => {
    expect(getHost('https://blog.docs.example.co.uk/page')).toBe('blog.docs.example.co.uk');
    expect(getRegistrableDomain('https://blog.docs.example.co.uk/page')).toBe('example.co.uk');
  });

  it('extracts scheme', () => {
    expect(getScheme('http://example.com')).toBe('http');
    expect(getScheme('javascript:void(0)')).toBe('javascript');
  });
});
