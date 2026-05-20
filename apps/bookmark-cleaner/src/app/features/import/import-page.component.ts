import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ParseWarning } from '../../core/models/bookmark.models';
import { BookmarkWorkerService } from '../../core/services/bookmark-worker.service';
import { WorkspaceStore } from '../../core/store/workspace.store';

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
    <section class="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <header class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 1 • Import</p>
          <h1 class="text-4xl font-semibold tracking-tight">Bring in your bookmark export</h1>
          <p class="max-w-2xl text-base text-slate-300">
            Start with a Chrome export HTML file. Trove reads it into a working snapshot so your
            original file and browser bookmarks remain untouched.
          </p>
        </div>

        <aside class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p class="font-semibold">What happens next</p>
          <ol class="mt-2 space-y-1 text-slate-300">
            <li>1. Parse links and folders locally</li>
            <li>2. Flag malformed entries</li>
            <li>3. Show quality summary</li>
          </ol>
        </aside>
      </header>

      <section class="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
        <label for="bookmark-file" class="mb-3 block text-sm font-medium text-slate-100">Bookmark HTML file</label>
        <input
          id="bookmark-file"
          type="file"
          accept=".html,text/html"
          class="block w-full rounded-xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-slate-100"
          (change)="onFileSelected($event)"
        />
        <p class="mt-3 text-xs text-slate-400">
          Tip: Export from Chrome Bookmarks Manager and upload that HTML file directly.
        </p>
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

      <section *ngIf="store.snapshot() as snapshot" class="space-y-6" aria-label="Import summary">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        <section *ngIf="warningGroups().length" class="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <header>
            <h2 class="text-xl font-semibold">Quality checks</h2>
            <p class="text-xs text-slate-400">Exported links include bookmarks from all folders, archived collections, and bookmarklets.</p>
            <p class="text-sm text-slate-300">
              We found a few items worth reviewing. These are safe warnings, not destructive errors.
            </p>
          </header>

          <div class="grid gap-3 md:grid-cols-2">
            <details *ngFor="let group of warningGroups()" class="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <summary class="cursor-pointer list-none font-medium text-slate-100">
                {{ group.label }}
                <span class="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{{ group.count }}</span>
              </summary>
              <ul class="mt-3 max-h-44 space-y-1 overflow-auto text-xs text-slate-300">
                <li *ngFor="let message of group.messages.slice(0, 20)">• {{ message }}</li>
              </ul>
            </details>
          </div>
        </section>

        <section class="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 class="text-lg font-semibold">Ready to review</h2>
          <p class="mt-1 text-sm text-slate-300">
            Your source file is untouched. Continue to inspect quality and prepare cleanup actions.
          </p>
          <a
            routerLink="/dashboard"
            class="mt-4 inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            Continue to review
          </a>
        </section>
      </section>
    </section>
  `,
})
export class ImportPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly worker = inject(BookmarkWorkerService);
  readonly error = signal<string | null>(null);

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

    try {
      this.store.setProcessing(true);
      const html = await file.text();
      const snapshot = await this.worker.parse(html);
      await this.store.save(snapshot);
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
}
