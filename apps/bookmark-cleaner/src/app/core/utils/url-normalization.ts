const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
]);

export const normalizeUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl.trim());
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';

    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname === '/') {
      url.pathname = '';
    }

    return url.toString();
  } catch {
    return rawUrl.trim();
  }
};

export const getDomain = (rawUrl: string): string => {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
};
