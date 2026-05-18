import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookmarkWorkerService } from '../../core/services/bookmark-worker.service';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 1</p>
        <h1 class="text-3xl font-semibold tracking-tight">Import bookmarks</h1>
        <p class="max-w-3xl text-sm text-slate-300">
          Upload your Chrome bookmarks export HTML. Trove creates a working snapshot and never
          modifies your source file.
        </p>
      </header>

      <section class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 space-y-4" aria-label="Import file">
        <label for="bookmark-file" class="block text-sm font-medium text-slate-100">Bookmark HTML file</label>
        <input
          id="bookmark-file"
          type="file"
          accept=".html,text/html"
          class="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          (change)="onFileSelected($event)"
        />

        <p class="text-xs text-slate-400">
          Recommended: export from Chrome Bookmarks Manager, then upload the HTML file here.
        </p>
      </section>

      <div
        *ngIf="store.isProcessing()"
        class="rounded-xl border border-cyan-700/60 bg-cyan-950/40 p-4 text-sm text-cyan-200"
        aria-live="polite"
      >
        Parsing bookmarks and preparing your workspace snapshot...
      </div>

      <div
        *ngIf="error()"
        class="rounded-xl border border-red-700/60 bg-red-950/40 p-4 text-sm text-red-200"
        role="alert"
      >
        {{ error() }}
      </div>

      <section
        *ngIf="store.snapshot() as snapshot"
        class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 space-y-4"
        aria-label="Import summary"
      >
        <h2 class="text-xl font-semibold">Import summary</h2>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article class="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-400">Bookmarks</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.totalBookmarks }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-400">Folders</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.totalFolders }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-400">Unique URLs</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.uniqueUrls }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p class="text-xs uppercase tracking-wide text-slate-400">Warnings</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.warningCount }}</p>
          </article>
        </div>

        <div *ngIf="snapshot.warnings.length" class="space-y-2">
          <h3 class="text-sm font-semibold">Warnings to review</h3>
          <ul class="max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
            <li *ngFor="let warning of snapshot.warnings.slice(0, 20)">• {{ warning.message }}</li>
          </ul>
        </div>

        <div class="flex flex-wrap gap-3 pt-1">
          <a
            routerLink="/dashboard"
            class="inline-flex items-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Continue to dashboard
          </a>
          <span class="inline-flex items-center text-xs text-slate-400">
            Source file remains unchanged until you export.
          </span>
        </div>
      </section>
    </section>
  `,
})
export class ImportPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly worker = inject(BookmarkWorkerService);
  readonly error = signal<string | null>(null);

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
}
