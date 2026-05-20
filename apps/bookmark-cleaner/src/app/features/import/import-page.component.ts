import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ParseWarning } from '../../core/models/bookmark.models';
import { BookmarkWorkerService } from '../../core/services/bookmark-worker.service';
import { UiPreferencesStore } from '../../core/store/ui-preferences.store';
import { WorkspaceStore } from '../../core/store/workspace.store';
import { getBookmarkManagerShortcut } from '../../core/utils/platform-shortcuts';

interface WarningGroup {
  key: ParseWarning['code'];
  label: string;
  count: number;
  messages: string[];
}

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.scss',
})
export class ImportPageComponent {
  private static readonly INTRO_MODAL_KEY = 'trove-import-intro-seen';
  readonly store = inject(WorkspaceStore);
  readonly uiPreferences = inject(UiPreferencesStore);
  private readonly worker = inject(BookmarkWorkerService);
  readonly error = signal<string | null>(null);
  readonly showSnapshotSummary = signal(false);
  readonly showHelp = signal(false);
  readonly showIntroModal = signal(false);
  readonly hasPersistedSnapshot = computed(() => this.store.snapshot() !== null);
  readonly bookmarkManagerShortcut = computed(() => {
    const os = this.uiPreferences.os();
    return getBookmarkManagerShortcut(os === 'mac' ? 'mac' : os === 'windows' ? 'windows' : 'linux');
  });

  public constructor() {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(ImportPageComponent.INTRO_MODAL_KEY)) {
      this.showIntroModal.set(true);
    }
  }

  readonly warningGroups = computed<WarningGroup[]>(() => {
    const warnings = this.store.snapshot()?.warnings ?? [];
    const groups = new Map<ParseWarning['code'], WarningGroup>();

    for (const warning of warnings) {
      if (!groups.has(warning.code)) {
        groups.set(warning.code, {
          key: warning.code,
          label: this.warningLabel(warning.code),
          count: 0,
          messages: [],
        });
      }

      const group = groups.get(warning.code)!;
      group.count += 1;
      group.messages.push(warning.message);
    }

    return [...groups.values()];
  });

  async onFileSelected(event: Event): Promise<void> {
    this.error.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    await this.parseFile(file);
    input.value = '';
  }

  private async parseFile(file: File): Promise<void> {
    try {
      this.store.setProcessing(true);
      const html = await file.text();
      const snapshot = await this.worker.parse(html);
      await this.store.save(snapshot);
      this.showSnapshotSummary.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to parse bookmark file');
    } finally {
      this.store.setProcessing(false);
    }
  }

  private warningLabel(code: ParseWarning['code']): string {
    switch (code) {
      case 'MISSING_TITLE':
        return 'Missing title (auto-derived)';
      case 'MISSING_URL':
        return 'Missing URL (skipped)';
      case 'MALFORMED_ENTRY':
        return 'Malformed entry';
      default:
        return 'Warnings';
    }
  }

  setGuideBrowser(browser: string): void {
    if (browser === 'chrome' || browser === 'edge' || browser === 'firefox' || browser === 'safari') {
      this.uiPreferences.setBrowser(browser);
    }
  }

  dismissIntroModal(): void {
    this.showIntroModal.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ImportPageComponent.INTRO_MODAL_KEY, '1');
    }
  }
}
