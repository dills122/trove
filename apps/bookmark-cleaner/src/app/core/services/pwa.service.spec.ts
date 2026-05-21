import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let versionEvents: Subject<VersionEvent>;
  let unrecoverableEvents: Subject<{ reason: string }>;
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    unrecoverable: Subject<{ reason: string }>;
    activateUpdate: jest.Mock;
    checkForUpdate: jest.Mock;
  };

  const setOnline = (online: boolean): void => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: online,
    });
  };

  const dispatchBeforeInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'dismissed'): void => {
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    };
    Object.assign(event, {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome, platform: 'web' }),
    });

    window.dispatchEvent(event);
  };

  const createService = (): PwaService => {
    versionEvents = new Subject<VersionEvent>();
    unrecoverableEvents = new Subject<{ reason: string }>();
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionEvents,
      unrecoverable: unrecoverableEvents,
      activateUpdate: jest.fn().mockResolvedValue(undefined),
      checkForUpdate: jest.fn().mockResolvedValue(false),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: swUpdateMock }],
    });

    return TestBed.inject(PwaService);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    jest.useFakeTimers();
    localStorage.clear();
    setOnline(true);
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes install support when browser emits beforeinstallprompt', () => {
    const service = createService();
    expect(service.installSupported()).toBe(false);

    dispatchBeforeInstallPrompt();

    expect(service.installSupported()).toBe(true);
  });

  it('persists install prompt dismissal', () => {
    const service = createService();

    dispatchBeforeInstallPrompt();
    expect(service.installSupported()).toBe(true);

    service.dismissInstallPrompt();

    expect(service.installSupported()).toBe(false);
    expect(localStorage.getItem('trove-pwa-install-dismissed')).toBe('1');
  });

  it('shows update banner on VERSION_READY unless dismissed for that hash', () => {
    const service = createService();

    versionEvents.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old-hash', appData: {} },
      latestVersion: { hash: 'new-hash', appData: {} },
    });

    expect(service.updateAvailable()).toBe(true);

    service.dismissUpdateBanner();
    expect(localStorage.getItem('trove-pwa-update-dismissed:new-hash')).toBe('1');

    versionEvents.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old2-hash', appData: {} },
      latestVersion: { hash: 'new-hash', appData: {} },
    });

    expect(service.updateAvailable()).toBe(false);
  });

  it('tracks online/offline events', () => {
    const service = createService();
    expect(service.isOnline()).toBe(true);

    setOnline(false);
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    setOnline(true);
    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);
  });

  it('checks for updates on startup and when returning online', async () => {
    const service = createService();
    expect(service).toBeTruthy();
    expect(swUpdateMock.checkForUpdate).toHaveBeenCalledTimes(1);
    await Promise.resolve();

    setOnline(false);
    window.dispatchEvent(new Event('offline'));
    setOnline(true);
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();

    expect(swUpdateMock.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('publishes unrecoverable service worker state', () => {
    const service = createService();
    expect(service.unrecoverableState()).toBeNull();

    unrecoverableEvents.next({ reason: 'Cache mismatch' });
    expect(service.unrecoverableState()).toBe('Cache mismatch');
  });

  it('shows manual install hint for iOS Safari when app-install prompt is unavailable', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    const service = createService();

    expect(service.installSupported()).toBe(false);
    expect(service.shouldShowManualInstallHint()).toBe(true);
    expect(service.manualInstallHint()).toContain('Add to Home Screen');
  });
});
