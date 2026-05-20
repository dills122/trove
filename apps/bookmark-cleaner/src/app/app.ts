import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PwaService } from './core/services/pwa.service';
import type { BrowserOption, LanguageOption, OsOption } from './core/store/ui-preferences.store';
import { getDetectedUiPreferences, UiPreferencesStore } from './core/store/ui-preferences.store';
import { WorkspaceStore } from './core/store/workspace.store';

interface WorkflowStep {
  id: number;
  label: string;
  path: string | null;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  readonly uiPreferences = inject(UiPreferencesStore);
  readonly pwa = inject(PwaService);

  readonly steps: WorkflowStep[] = [
    { id: 1, label: 'Import', path: '/import' },
    { id: 2, label: 'Review', path: '/dashboard' },
    { id: 3, label: 'Organize', path: '/organize' },
    { id: 4, label: 'Export', path: null },
  ];

  readonly currentStep = signal(1);
  readonly isConfigOpen = signal(false);
  readonly draftLanguage = signal<LanguageOption>(this.uiPreferences.language());
  readonly draftBrowser = signal<BrowserOption>(this.uiPreferences.browser());
  readonly draftOs = signal<OsOption>(this.uiPreferences.os());
  readonly languageOptions: LanguageOption[] = ['en', 'es', 'fr', 'de'];
  readonly browserOptions: BrowserOption[] = ['chrome', 'edge', 'firefox', 'safari'];
  readonly osOptions: OsOption[] = ['windows', 'mac', 'linux', 'mobile'];

  public constructor() {
    void this.workspaceStore.load();
    this.updateCurrentStep(this.router.url);

    effect(() => {
      if (this.isConfigOpen()) {
        return;
      }
      this.draftLanguage.set(this.uiPreferences.language());
      this.draftBrowser.set(this.uiPreferences.browser());
      this.draftOs.set(this.uiPreferences.os());
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCurrentStep(event.urlAfterRedirects));
  }

  isStepActive(stepId: number): boolean {
    return this.currentStep() === stepId;
  }

  isStepComplete(stepId: number): boolean {
    return this.currentStep() > stepId;
  }

  setOs(os: string): void {
    if (os === 'windows' || os === 'mac' || os === 'linux' || os === 'mobile') {
      this.uiPreferences.setOs(os);
    }
  }

  setLanguage(language: string): void {
    if (language === 'en' || language === 'es' || language === 'fr' || language === 'de') {
      this.uiPreferences.setLanguage(language);
    }
  }

  setBrowser(browser: string): void {
    if (browser === 'chrome' || browser === 'edge' || browser === 'firefox' || browser === 'safari') {
      this.uiPreferences.setBrowser(browser);
    }
  }

  openConfig(): void {
    this.draftLanguage.set(this.uiPreferences.language());
    this.draftBrowser.set(this.uiPreferences.browser());
    this.draftOs.set(this.uiPreferences.os());
    this.isConfigOpen.set(true);
  }

  closeConfig(): void {
    this.isConfigOpen.set(false);
  }

  toggleEnvPanel(): void {
    if (this.isConfigOpen()) {
      this.closeConfig();
      return;
    }
    this.openConfig();
  }

  applyConfig(): void {
    this.uiPreferences.setAll({
      language: this.draftLanguage(),
      browser: this.draftBrowser(),
      os: this.draftOs(),
    });
    this.closeConfig();
  }

  resetConfigToDetected(): void {
    const detected = getDetectedUiPreferences();
    this.draftLanguage.set(detected.language);
    this.draftBrowser.set(detected.browser);
    this.draftOs.set(detected.os);
  }

  environmentSummary(): string {
    return `${this.browserLabel(this.uiPreferences.browser())} on ${this.osLabel(this.uiPreferences.os())} · ${this.languageLabel(this.uiPreferences.language())}`;
  }

  languageLabel(language: string): string {
    if (language === 'es') {
      return 'Spanish';
    }
    if (language === 'fr') {
      return 'French';
    }
    if (language === 'de') {
      return 'German';
    }
    return 'English';
  }

  browserLabel(browser: string): string {
    if (browser === 'edge') {
      return 'Edge';
    }
    if (browser === 'firefox') {
      return 'Firefox';
    }
    if (browser === 'safari') {
      return 'Safari';
    }
    return 'Chrome';
  }

  setDraftLanguage(language: string): void {
    if (language === 'en' || language === 'es' || language === 'fr' || language === 'de') {
      this.draftLanguage.set(language);
    }
  }

  setDraftBrowser(browser: string): void {
    if (browser === 'chrome' || browser === 'edge' || browser === 'firefox' || browser === 'safari') {
      this.draftBrowser.set(browser);
    }
  }

  setDraftOs(os: string): void {
    if (os === 'windows' || os === 'mac' || os === 'linux' || os === 'mobile') {
      this.draftOs.set(os);
    }
  }

  osLabel(os: string): string {
    if (os === 'mac') {
      return 'macOS';
    }
    if (os === 'windows') {
      return 'Windows';
    }
    if (os === 'linux') {
      return 'Linux';
    }
    return 'Mobile';
  }

  private updateCurrentStep(url: string): void {
    if (url.startsWith('/organize')) {
      this.currentStep.set(3);
      return;
    }

    if (url.startsWith('/dashboard')) {
      this.currentStep.set(2);
      return;
    }

    this.currentStep.set(1);
  }

  installApp(): void {
    void this.pwa.promptInstall();
  }

  applyUpdate(): void {
    void this.pwa.applyUpdate();
  }
}
