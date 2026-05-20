export type PlatformKind = 'mac' | 'windows' | 'linux' | 'unknown';
export type BrowserKind = 'chrome' | 'edge' | 'firefox' | 'safari';
export type LanguageKind = 'en' | 'es' | 'fr' | 'de';

export interface ShortcutDisplay {
  comboText: string;
  keycaps: string[];
}

export const detectPlatformKind = (): PlatformKind => {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const uaDataPlatform = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData?.platform?.toLowerCase();
  const platform = uaDataPlatform ?? navigator.platform?.toLowerCase() ?? '';
  if (platform.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('win')) {
    return 'windows';
  }
  if (platform.includes('linux')) {
    return 'linux';
  }

  const userAgent = navigator.userAgent?.toLowerCase() ?? '';
  if (userAgent.includes('mac os') || userAgent.includes('macintosh')) {
    return 'mac';
  }
  if (userAgent.includes('windows')) {
    return 'windows';
  }
  if (userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
};

export const getBookmarkManagerShortcut = (platform: PlatformKind): ShortcutDisplay => {
  if (platform === 'mac') {
    return {
      comboText: 'Cmd + Option + B',
      keycaps: ['⌘', '⌥', 'B'],
    };
  }

  if (platform === 'windows') {
    return {
      comboText: 'Ctrl + Shift + O',
      keycaps: ['Ctrl', 'Shift', 'O'],
    };
  }

  return {
    comboText: 'Ctrl + Shift + O',
    keycaps: ['Ctrl', 'Shift', 'O'],
  };
};

export const detectBrowserKind = (): BrowserKind => {
  if (typeof navigator === 'undefined') {
    return 'chrome';
  }

  const userAgent = navigator.userAgent?.toLowerCase() ?? '';

  if (userAgent.includes('edg/')) {
    return 'edge';
  }
  if (userAgent.includes('firefox/')) {
    return 'firefox';
  }
  if (
    userAgent.includes('safari/') &&
    !userAgent.includes('chrome/') &&
    !userAgent.includes('crios/') &&
    !userAgent.includes('edg/')
  ) {
    return 'safari';
  }

  return 'chrome';
};

export const detectLanguageKind = (): LanguageKind => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const language = navigator.language?.toLowerCase() ?? 'en';
  if (language.startsWith('es')) {
    return 'es';
  }
  if (language.startsWith('fr')) {
    return 'fr';
  }
  if (language.startsWith('de')) {
    return 'de';
  }

  return 'en';
};
