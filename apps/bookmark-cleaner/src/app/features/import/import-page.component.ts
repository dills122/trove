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
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 max-[375px]:space-y-4 max-[375px]:px-3.5 sm:space-y-8 sm:px-6 sm:py-10">
      <div *ngIf="showIntroModal()" class="fixed inset-0 z-40">
        <button
          type="button"
          class="absolute inset-0 h-full w-full bg-slate-950/80 backdrop-blur-sm"
          (click)="dismissIntroModal()"
          aria-label="Close first-time import guide"
        ></button>

        <section
          role="dialog"
          aria-label="First-time import guide"
          class="absolute left-1/2 top-1/2 z-50 w-[min(95vw,60rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950 sm:p-6"
        >
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-cyan-300">Welcome</p>
              <h2 class="mt-1 text-xl font-semibold text-slate-100">How to export bookmarks (Chrome)</h2>
              <p class="mt-1 text-sm text-slate-300">
                Use this once, then upload the exported HTML file in Trove.
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5"
              (click)="dismissIntroModal()"
            >
              Close
            </button>
          </header>

          <div class="grid gap-3 sm:grid-cols-3">
            <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <img
                src="infographics/chrome-step-1.svg"
                alt="Chrome Bookmarks Manager view with shortcut highlighted"
                class="mb-3 h-auto w-full rounded-lg border border-white/10"
              />
              <p class="text-sm font-medium text-slate-100">1. Open Bookmarks Manager</p>
              <p class="mt-1 text-xs text-slate-300">
                macOS:
                <span class="font-semibold text-slate-100">⌘ + ⌥ + B</span>
                · Windows/Linux:
                <span class="font-semibold text-slate-100">Ctrl + Shift + O</span>
              </p>
            </article>

            <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <img
                src="infographics/chrome-step-2.svg"
                alt="Chrome bookmarks interface showing three-dot menu area"
                class="mb-3 h-auto w-full rounded-lg border border-white/10"
              />
              <p class="text-sm font-medium text-slate-100">2. Use the menu</p>
              <p class="mt-1 text-xs text-slate-300">Open the three-dot menu in Bookmark Manager.</p>
            </article>

            <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <img
                src="infographics/chrome-step-3.svg"
                alt="Exported bookmark HTML file and upload flow"
                class="mb-3 h-auto w-full rounded-lg border border-white/10"
              />
              <p class="text-sm font-medium text-slate-100">3. Export + upload</p>
              <p class="mt-1 text-xs text-slate-300">
                Select Export bookmarks, then upload the <code>.html</code> file here.
              </p>
            </article>
          </div>

          <footer class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
            <p class="text-xs text-slate-400">Source bookmarks are never modified in place.</p>
            <button
              type="button"
              class="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
              (click)="dismissIntroModal()"
            >
              Got it
            </button>
          </footer>
        </section>
      </div>

      <header class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 1 • Import</p>
          <h1 class="text-3xl font-semibold tracking-tight max-[375px]:text-[2rem] max-[375px]:leading-[1.1] sm:text-4xl">Bring in your bookmark export</h1>
          <p class="max-w-2xl text-base text-slate-300 max-[375px]:text-[1.02rem] max-[375px]:leading-7">
            Start with a Chrome export HTML file. Trove reads it into a working snapshot so your
            original file and browser bookmarks remain untouched.
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              class="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5"
              (click)="showHelp.set(!showHelp())"
            >
              {{ showHelp() ? 'Hide export guide' : 'How to export bookmarks' }}
            </button>
          </div>
        </div>

        <aside class="rounded-2xl border border-white/10 bg-white/5 p-4 max-[375px]:p-3.5 text-sm text-slate-200">
          <p class="font-semibold">What happens next</p>
          <ol class="mt-2 space-y-1 text-slate-300">
            <li>1. Parse links and folders locally</li>
            <li>2. Flag malformed entries</li>
            <li>3. Show quality summary</li>
          </ol>
        </aside>
      </header>

      <section *ngIf="showHelp()" class="rounded-3xl border border-white/10 bg-white/5 p-4 max-[375px]:p-3.5 sm:p-6">
        <header class="mb-4">
          <h2 class="text-xl font-semibold">Export guide</h2>
          <p class="mt-1 text-sm text-slate-300">
            Chrome format is fully supported right now. Other browser guides are staged for upcoming support.
          </p>
        </header>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-xs font-medium"
            [ngClass]="
              uiPreferences.browser() === 'chrome'
                ? 'bg-white text-slate-950'
                : 'border border-white/20 text-slate-300'
            "
            (click)="setGuideBrowser('chrome')"
          >
            Chrome
          </button>
          <button
            type="button"
            class="inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-xs font-medium"
            [ngClass]="
              uiPreferences.browser() === 'edge'
                ? 'bg-white text-slate-950'
                : 'border border-white/20 text-slate-300'
            "
            (click)="setGuideBrowser('edge')"
          >
            Edge
          </button>
          <button
            type="button"
            class="inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-xs font-medium"
            [ngClass]="
              uiPreferences.browser() === 'firefox'
                ? 'bg-white text-slate-950'
                : 'border border-white/20 text-slate-300'
            "
            (click)="setGuideBrowser('firefox')"
          >
            Firefox
          </button>
          <button
            type="button"
            class="inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-xs font-medium"
            [ngClass]="
              uiPreferences.browser() === 'safari'
                ? 'bg-white text-slate-950'
                : 'border border-white/20 text-slate-300'
            "
            (click)="setGuideBrowser('safari')"
          >
            Safari
          </button>
        </div>

        <div *ngIf="uiPreferences.browser() === 'chrome'" class="mt-4 space-y-4">
          <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-cyan-300">Visual Walkthrough</p>
            <h3 class="mt-2 text-base font-semibold text-slate-100">Export from Chrome in 3 steps</h3>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                <img
                  src="infographics/chrome-step-1.svg"
                  alt="Chrome Bookmarks Manager view with shortcut highlighted"
                  class="mb-3 h-auto w-full rounded-lg border border-white/10"
                />
                <div class="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500/20 px-2 text-xs font-semibold text-cyan-100">
                  1
                </div>
                <p class="text-sm font-medium text-slate-100">Open Bookmarks Manager</p>
                <p class="mt-1 text-xs text-slate-300">
                  Press
                  <span class="ml-1 inline-flex items-center gap-1 align-middle">
                    <span
                      *ngFor="let key of bookmarkManagerShortcut().keycaps"
                      class="inline-flex min-w-7 items-center justify-center rounded-md border border-white/20 bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-slate-100"
                    >
                      {{ key }}
                    </span>
                  </span>
                  <span class="ml-1 text-slate-400">({{ bookmarkManagerShortcut().comboText }})</span>
                </p>
              </article>

              <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                <img
                  src="infographics/chrome-step-2.svg"
                  alt="Chrome bookmarks interface showing three-dot menu area"
                  class="mb-3 h-auto w-full rounded-lg border border-white/10"
                />
                <div class="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500/20 px-2 text-xs font-semibold text-cyan-100">
                  2
                </div>
                <p class="text-sm font-medium text-slate-100">Use the menu</p>
                <p class="mt-1 text-xs text-slate-300">Click the <strong>three-dot</strong> menu in the manager.</p>
              </article>

              <article class="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                <img
                  src="infographics/chrome-step-3.svg"
                  alt="Exported bookmark HTML file and upload flow"
                  class="mb-3 h-auto w-full rounded-lg border border-white/10"
                />
                <div class="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500/20 px-2 text-xs font-semibold text-cyan-100">
                  3
                </div>
                <p class="text-sm font-medium text-slate-100">Export + upload</p>
                <p class="mt-1 text-xs text-slate-300">
                  Select <strong>Export bookmarks</strong>, then upload that HTML file here.
                </p>
              </article>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-slate-100">Troubleshooting</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
              <li>If file type is wrong, make sure the export ends in <code>.html</code>.</li>
              <li>If import looks stale, choose a new file to replace the loaded workspace.</li>
              <li>Source bookmarks are never modified in place.</li>
            </ul>
          </div>
        </div>

        <div *ngIf="uiPreferences.browser() !== 'chrome'" class="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
          This guide is coming soon. For now, export from Chrome Bookmarks Manager to HTML and import that file here.
        </div>
      </section>

      <section class="rounded-3xl border border-white/10 bg-slate-900/70 p-4 max-[375px]:p-3.5 shadow-xl shadow-slate-950/40 sm:p-6">
        <label for="bookmark-file" class="mb-3 block text-sm font-medium text-slate-100">Bookmark HTML file</label>
        <input
          id="bookmark-file"
          type="file"
          accept=".html,text/html"
          class="block min-h-11 w-full rounded-xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-slate-100"
          (change)="onFileSelected($event)"
        />
        <p class="mt-3 text-xs text-slate-400">
          Tip: Export from Chrome Bookmarks Manager and upload that HTML file directly.
        </p>
      </section>

      <section
        *ngIf="hasPersistedSnapshot() && !showSnapshotSummary()"
        class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
      >
        <p>
          A previous import is loaded from local storage. The file input stays empty until you choose a new file.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5"
            (click)="showSnapshotSummary.set(true)"
          >
            View loaded summary
          </button>
        </div>
      </section>

      <div
        *ngIf="store.isProcessing()"
        class="rounded-2xl border border-cyan-600/30 bg-cyan-500/10 p-4 text-sm text-cyan-100"
        aria-live="polite"
      >
        Parsing links, deriving metadata, and preparing your local workspace...
      </div>

      <div *ngIf="error()" class="rounded-2xl border border-red-600/40 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
        {{ error() }}
      </div>

      <section
        *ngIf="store.snapshot() as snapshot"
        [class.hidden]="!showSnapshotSummary()"
        class="space-y-5 max-[375px]:space-y-4 sm:space-y-6"
        aria-label="Import summary"
      >
        <div class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <article class="metric-card">
            <p class="metric-label">Exported links</p>
            <p class="metric-value">{{ snapshot.analysis.totalBookmarks }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Folders</p>
            <p class="metric-value">{{ snapshot.analysis.totalFolders }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Unique links</p>
            <p class="metric-value">{{ snapshot.analysis.uniqueUrls }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Bookmarklets</p>
            <p class="metric-value">{{ snapshot.analysis.bookmarkletCount }}</p>
          </article>
        </div>

        <section *ngIf="warningGroups().length" class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 max-[375px]:p-3.5 sm:p-6">
          <header>
            <h2 class="text-xl font-semibold">Quality checks</h2>
            <p class="text-xs text-slate-400">Exported links include bookmarks from all folders, archived collections, and bookmarklets.</p>
            <p class="text-sm text-slate-300">
              We found a few items worth reviewing. These are safe warnings, not destructive errors.
            </p>
          </header>

          <div class="grid gap-3 lg:grid-cols-2">
            <details *ngFor="let group of warningGroups()" class="rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4">
              <summary class="cursor-pointer list-none font-medium text-slate-100">
                {{ group.label }}
                <span class="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{{ group.count }}</span>
              </summary>
              <ul class="mt-3 space-y-1 break-words text-xs text-slate-300 lg:max-h-44 lg:overflow-auto">
                <li *ngFor="let message of group.messages.slice(0, 20)">• {{ message }}</li>
              </ul>
            </details>
          </div>
        </section>

        <section class="rounded-3xl border border-white/10 bg-slate-900/60 p-5 max-[375px]:p-4 sm:p-6">
          <h2 class="text-lg font-semibold">Ready to review</h2>
          <p class="mt-1 text-sm text-slate-300">
            Your source file is untouched. Continue to inspect quality and prepare cleanup actions.
          </p>
          <a
            routerLink="/dashboard"
            class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            Continue to review
          </a>
        </section>
      </section>
    </section>
  `,
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
