export const deriveTitleFromUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname.replace(/\/$/, '');
    if (path) {
      const lastSegment = path.split('/').filter(Boolean).at(-1);
      if (lastSegment) {
        return decodeURIComponent(lastSegment);
      }
    }
    return url.hostname;
  } catch {
    return 'Untitled bookmark';
  }
};
