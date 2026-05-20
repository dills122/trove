import { Injectable, computed, signal } from '@angular/core';
import {
  detectBrowserKind,
  detectLanguageKind,
  detectPlatformKind,
  type PlatformKind,
} from '../utils/platform-shortcuts';

export type LanguageOption = 'en' | 'es' | 'fr' | 'de';
export type BrowserOption = 'chrome' | 'edge' | 'firefox' | 'safari';
export type OsOption = 'windows' | 'mac' | 'linux' | 'mobile';

const STORAGE_KEY = 'trove-ui-preferences';

interface UiPreferencesState {
  language: LanguageOption;
  browser: BrowserOption;
  os: OsOption;
}

const mapPlatformToOs = (platform: PlatformKind): OsOption => {
  switch (platform) {
    case 'mac':
      return 'mac';
    case 'windows':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'mobile';
  }
};

const initialState = (): UiPreferencesState => ({
  language: detectLanguageKind(),
  browser: detectBrowserKind(),
  os: mapPlatformToOs(detectPlatformKind()),
});

export const getDetectedUiPreferences = (): {
  language: LanguageOption;
  browser: BrowserOption;
  os: OsOption;
} => initialState();

@Injectable({ providedIn: 'root' })
export class UiPreferencesStore {
  private readonly state = signal<UiPreferencesState>(initialState());

  readonly language = computed(() => this.state().language);
  readonly browser = computed(() => this.state().browser);
  readonly os = computed(() => this.state().os);

  public constructor() {
    this.load();
  }

  setOs(os: OsOption): void {
    this.state.update((current) => ({ ...current, os }));
    this.save();
  }

  setLanguage(language: LanguageOption): void {
    this.state.update((current) => ({ ...current, language }));
    this.save();
  }

  setBrowser(browser: BrowserOption): void {
    this.state.update((current) => ({ ...current, browser }));
    this.save();
  }

  setAll(next: UiPreferencesState): void {
    this.state.set(next);
    this.save();
  }

  resetToDetectedDefaults(): void {
    this.state.set(initialState());
    this.save();
  }

  private load(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<UiPreferencesState>;
      if (
        (parsed.os === 'windows' || parsed.os === 'mac' || parsed.os === 'linux' || parsed.os === 'mobile') &&
        (parsed.language === 'en' || parsed.language === 'es' || parsed.language === 'fr' || parsed.language === 'de') &&
        (parsed.browser === 'chrome' || parsed.browser === 'edge' || parsed.browser === 'firefox' || parsed.browser === 'safari')
      ) {
        this.state.set({
          language: parsed.language,
          browser: parsed.browser,
          os: parsed.os,
        });
      }
    } catch {
      // Keep defaults when parsing storage fails.
    }
  }

  private save(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // Ignore storage write failures.
    }
  }
}
