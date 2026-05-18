import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 2</p>
        <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p class="max-w-3xl text-sm text-slate-300">
          Review your imported workspace metrics before moving into duplicate cleanup and
          organization.
        </p>
      </header>

      <section
        *ngIf="!store.snapshot()"
        class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-300"
      >
        <p>No workspace loaded yet.</p>
        <a routerLink="/import" class="mt-3 inline-block rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-slate-950">
          Import bookmarks
        </a>
      </section>

      <ng-container *ngIf="store.snapshot() as snapshot">
        <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
          <article class="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Bookmarks</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.totalBookmarks }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Folders</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.totalFolders }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Unique URLs</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.uniqueUrls }}</p>
          </article>
          <article class="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Warnings</p>
            <p class="mt-1 text-2xl font-semibold">{{ snapshot.analysis.warningCount }}</p>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <h2 class="text-lg font-semibold">Data quality</h2>
            <ul class="mt-3 space-y-2 text-sm text-slate-200">
              <li class="flex items-center justify-between">
                <span>Malformed entries</span>
                <strong>{{ snapshot.analysis.malformedEntries }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Warnings</span>
                <strong>{{ snapshot.analysis.warningCount }}</strong>
              </li>
            </ul>
            <p class="mt-4 text-xs text-slate-400">
              Warnings are non-destructive and can be reviewed before any export action.
            </p>
          </article>

          <article class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <h2 class="text-lg font-semibold">Next actions</h2>
            <ol class="mt-3 space-y-2 text-sm text-slate-200">
              <li>1. Review warnings for malformed entries.</li>
              <li>2. Start duplicate grouping and resolution.</li>
              <li>3. Build and preview organization proposals.</li>
            </ol>
            <a routerLink="/import" class="mt-4 inline-block text-sm text-cyan-300 underline">
              Re-import a different file
            </a>
          </article>
        </section>
      </ng-container>
    </section>
  `,
})
export class DashboardPageComponent {
  readonly store = inject(WorkspaceStore);
}
