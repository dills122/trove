import { Injectable, computed, inject, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly deferredInstallPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installed = signal(false);
  readonly isOnline = signal(true);
  readonly updateAvailable = signal(false);
  readonly installSupported = computed(() => this.deferredInstallPrompt() !== null && !this.installed());

  public constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

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
          this.updateAvailable.set(true);
        }
      });
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
    this.updateAvailable.set(false);
  }
}
