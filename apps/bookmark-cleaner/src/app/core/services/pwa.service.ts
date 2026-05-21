import { Injectable, computed, inject, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private static readonly INSTALL_DISMISSED_KEY = 'trove-pwa-install-dismissed';
  private static readonly UPDATE_DISMISSED_PREFIX = 'trove-pwa-update-dismissed:';
  private static readonly UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  private readonly swUpdate = inject(SwUpdate);
  private readonly deferredInstallPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installed = signal(false);
  private readonly installDismissed = signal(false);
  private readonly readyUpdateHash = signal<string | null>(null);
  private readonly updateCheckInFlight = signal(false);
  readonly isOnline = signal(true);
  readonly updateAvailable = signal(false);
  readonly unrecoverableState = signal<string | null>(null);
  readonly isCheckingForUpdate = computed(() => this.updateCheckInFlight());
  readonly installSupported = computed(
    () => this.deferredInstallPrompt() !== null && !this.installed() && !this.installDismissed(),
  );

  public constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.installDismissed.set(localStorage.getItem(PwaService.INSTALL_DISMISSED_KEY) === '1');
    const standaloneMode =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
    this.installed.set(standaloneMode);

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
      this.installDismissed.set(true);
      localStorage.setItem(PwaService.INSTALL_DISMISSED_KEY, '1');
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
      this.installDismissed.set(true);
      localStorage.setItem(PwaService.INSTALL_DISMISSED_KEY, '1');
      return true;
    }

    this.installDismissed.set(true);
    localStorage.setItem(PwaService.INSTALL_DISMISSED_KEY, '1');
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

  async checkForUpdates(): Promise<void> {
    if (!this.swUpdate.isEnabled || !this.isOnline() || this.updateCheckInFlight()) {
      return;
    }

    this.updateCheckInFlight.set(true);
    try {
      await this.swUpdate.checkForUpdate();
    } finally {
      this.updateCheckInFlight.set(false);
    }
  }

  dismissInstallPrompt(): void {
    this.installDismissed.set(true);
    localStorage.setItem(PwaService.INSTALL_DISMISSED_KEY, '1');
  }
}
