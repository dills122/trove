import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { BrowserOption, LanguageOption, OsOption } from '../../store/ui-preferences.store';

@Component({
  selector: 'app-environment-settings-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './environment-settings-panel.component.html',
})
export class EnvironmentSettingsPanelComponent {
  readonly isOpen = input(false);

  readonly draftBrowser = input<BrowserOption>('chrome');
  readonly draftLanguage = input<LanguageOption>('en');
  readonly draftOs = input<OsOption>('windows');

  readonly browserOptions = input<BrowserOption[]>(['chrome', 'edge', 'firefox', 'safari']);
  readonly languageOptions = input<LanguageOption[]>(['en', 'es', 'fr', 'de']);
  readonly osOptions = input<OsOption[]>(['windows', 'mac', 'linux', 'mobile']);
  readonly installSupported = input(false);

  readonly closePanel = output<void>();
  readonly applyChanges = output<void>();
  readonly resetDefaults = output<void>();
  readonly browserChange = output<string>();
  readonly languageChange = output<string>();
  readonly osChange = output<string>();
  readonly installRequest = output<void>();

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
}
