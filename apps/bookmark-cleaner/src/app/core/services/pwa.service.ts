import { Injectable, computed, inject, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private static readonly UPDATE_DISMISSED_PREFIX = 'trove-pwa-update-dismissed:';
  private static readonly UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  private static readonly MANUAL_UPDATE_COOLDOWN_MS = 20 * 1000;
  private static readonly UPDATE_STATUS_HIDE_MS = 6 * 1000;
  private readonly swUpdate = inject(SwUpdate);
  private readonly deferredInstallPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installed = signal(false);
  private readonly readyUpdateHash = signal<string | null>(null);
  private readonly updateCheckInFlight = signal(false);
  private readonly manualUpdateCooldown = signal(false);
  readonly isOnline = signal(true);
  readonly updateAvailable = signal(false);
  readonly unrecoverableState = signal<string | null>(null);
  readonly manualInstallHint = signal<string | null>(null);
  readonly updateStatusMessage = signal<string | null>(null);
  readonly updateChecksSupported = this.swUpdate.isEnabled;
  readonly isCheckingForUpdate = computed(() => this.updateCheckInFlight());
  readonly canManualCheckForUpdate = computed(
    () =>
      this.swUpdate.isEnabled &&
      this.isOnline() &&
      !this.isCheckingForUpdate() &&
      !this.manualUpdateCooldown(),
  );
  readonly installSupported = computed(() => this.deferredInstallPrompt() !== null && !this.installed());
  readonly shouldShowManualInstallHint = computed(
    () => !this.installed() && !this.installSupported() && this.manualInstallHint() !== null,
  );

  public constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const standaloneMode =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
    this.installed.set(standaloneMode);
    this.manualInstallHint.set(this.detectManualInstallHint());

    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      void this.checkForUpdates();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline()) {
        void this.checkForUpdates();
      }
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredInstallPrompt.set(event as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.deferredInstallPrompt.set(null);
    });

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
        if (event.type === 'VERSION_READY') {
          const latestHash = event.latestVersion.hash;
          this.readyUpdateHash.set(latestHash);
          const dismissed = localStorage.getItem(`${PwaService.UPDATE_DISMISSED_PREFIX}${latestHash}`) === '1';
          this.updateAvailable.set(!dismissed);
        }
      });
      this.swUpdate.unrecoverable.subscribe((event) => {
        this.unrecoverableState.set(event.reason);
      });
      void this.checkForUpdates();
      window.setInterval(() => {
        void this.checkForUpdates();
      }, PwaService.UPDATE_CHECK_INTERVAL_MS);
    }
  }

  async promptInstall(): Promise<boolean> {
    const promptEvent = this.deferredInstallPrompt();
    if (!promptEvent) {
      return false;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    this.deferredInstallPrompt.set(null);

    if (choice.outcome === 'accepted') {
      this.installed.set(true);
      return true;
    }

    return false;
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    await this.swUpdate.activateUpdate();
    document.location.reload();
  }

  dismissUpdateBanner(): void {
    const hash = this.readyUpdateHash();
    if (hash) {
      localStorage.setItem(`${PwaService.UPDATE_DISMISSED_PREFIX}${hash}`, '1');
    }
    this.updateAvailable.set(false);
  }

  async checkForUpdates(options: { manual?: boolean } = {}): Promise<void> {
    const isManual = options.manual === true;

    if (!this.swUpdate.isEnabled) {
      if (isManual) {
        this.updateStatusMessage.set('Update checks are unavailable in local dev mode.');
        this.scheduleStatusClear();
      }
      return;
    }

    if (isManual && this.manualUpdateCooldown()) {
      this.updateStatusMessage.set('Update check cooldown active. Try again in a few seconds.');
      this.scheduleStatusClear();
      return;
    }

    if (!this.isOnline() || this.updateCheckInFlight()) {
      return;
    }

    this.updateCheckInFlight.set(true);
    try {
      const updateDetected = await this.swUpdate.checkForUpdate();
      if (isManual) {
        if (updateDetected) {
          this.updateStatusMessage.set('Update found. Reload when ready.');
        } else {
          this.updateStatusMessage.set('No updates found. You are on the latest version.');
        }
        this.scheduleStatusClear();
      }
    } catch {
      if (isManual) {
        this.updateStatusMessage.set('Update check failed. Please try again shortly.');
        this.scheduleStatusClear();
      }
    } finally {
      this.updateCheckInFlight.set(false);
      if (isManual) {
        this.startManualCheckCooldown();
      }
    }
  }

  dismissUpdateStatusMessage(): void {
    this.updateStatusMessage.set(null);
  }

  private startManualCheckCooldown(): void {
    this.manualUpdateCooldown.set(true);
    window.setTimeout(() => {
      this.manualUpdateCooldown.set(false);
    }, PwaService.MANUAL_UPDATE_COOLDOWN_MS);
  }

  private scheduleStatusClear(): void {
    window.setTimeout(() => {
      this.updateStatusMessage.set(null);
    }, PwaService.UPDATE_STATUS_HIDE_MS);
  }

  private detectManualInstallHint(): string | null {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariEngine = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

    if (isIosDevice && isSafariEngine) {
      return 'In Safari, tap Share and choose “Add to Home Screen” to install Trove.';
    }

    return null;
  }
}
