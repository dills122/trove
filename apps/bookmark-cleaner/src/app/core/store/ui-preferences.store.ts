import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import {
  detectBrowserKind,
  detectLanguageKind,
  detectPlatformKind,
  type PlatformKind,
} from '../utils/platform-shortcuts';
import { createLocalStorageJsonAdapter } from './store-persistence';

export type LanguageOption = 'en' | 'es' | 'fr' | 'de';
export type BrowserOption = 'chrome' | 'edge' | 'firefox' | 'safari';
export type OsOption = 'windows' | 'mac' | 'linux' | 'mobile';

const STORAGE_KEY = 'trove-ui-preferences';
const persistence = createLocalStorageJsonAdapter<UiPreferencesState>(STORAGE_KEY);

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

const createDetectedDefaults = (): UiPreferencesState => ({
  language: detectLanguageKind(),
  browser: detectBrowserKind(),
  os: mapPlatformToOs(detectPlatformKind()),
});

export const getDetectedUiPreferences = (): {
  language: LanguageOption;
  browser: BrowserOption;
  os: OsOption;
} => createDetectedDefaults();

const isValidState = (value: Partial<UiPreferencesState>): value is UiPreferencesState =>
  (value.os === 'windows' || value.os === 'mac' || value.os === 'linux' || value.os === 'mobile') &&
  (value.language === 'en' || value.language === 'es' || value.language === 'fr' || value.language === 'de') &&
  (value.browser === 'chrome' || value.browser === 'edge' || value.browser === 'firefox' || value.browser === 'safari');

const loadPersistedState = (): UiPreferencesState | null => {
  const parsed = persistence.read() as Partial<UiPreferencesState> | null;
  if (!parsed || !isValidState(parsed)) {
    return null;
  }
  return parsed;
};

const persistState = (state: UiPreferencesState): void => {
  persistence.write(state);
};

export const UiPreferencesStore = signalStore(
  { providedIn: 'root' },
  withState<UiPreferencesState>(createDetectedDefaults()),
  withComputed(({ language, browser, os }) => ({
    summary: computed(() => `${browser()} on ${os()} · ${language()}`),
  })),
  withMethods((store) => ({
    setOs(os: OsOption): void {
      patchState(store, { os });
      persistState({ language: store.language(), browser: store.browser(), os: store.os() });
    },
    setLanguage(language: LanguageOption): void {
      patchState(store, { language });
      persistState({ language: store.language(), browser: store.browser(), os: store.os() });
    },
    setBrowser(browser: BrowserOption): void {
      patchState(store, { browser });
      persistState({ language: store.language(), browser: store.browser(), os: store.os() });
    },
    setAll(next: UiPreferencesState): void {
      patchState(store, next);
      persistState({ language: store.language(), browser: store.browser(), os: store.os() });
    },
    resetToDetectedDefaults(): void {
      const detected = createDetectedDefaults();
      patchState(store, detected);
      persistState({ language: store.language(), browser: store.browser(), os: store.os() });
    },
  })),
  withHooks({
    onInit(store) {
      const persisted = loadPersistedState();
      if (persisted) {
        patchState(store, persisted);
      }
    },
  }),
);
