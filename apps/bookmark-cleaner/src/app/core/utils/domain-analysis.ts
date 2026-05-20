import { getDomain } from 'tldts';

export const getRegistrableDomain = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    const domain = getDomain(url.hostname);
    return domain ?? url.hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
};

export const getHost = (rawUrl: string): string => {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
};

export const getScheme = (rawUrl: string): string => {
  try {
    const scheme = new URL(rawUrl).protocol.replace(':', '').toLowerCase();
    return scheme || 'unknown';
  } catch {
    return 'unknown';
  }
};
