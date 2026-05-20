import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { detectDuplicateGroups } from '../../core/analysis/duplicate-detection';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-organize-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 max-[375px]:space-y-4 max-[375px]:px-3.5 sm:space-y-8 sm:px-6 sm:py-10">
      <header class="space-y-3">
        <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 3 • Organize</p>
        <h1 class="text-3xl font-semibold tracking-tight max-[375px]:text-[2rem] max-[375px]:leading-[1.1] sm:text-4xl">
          Plan duplicate cleanup actions
        </h1>
        <p class="max-w-3xl text-base text-slate-300 max-[375px]:text-[1.02rem] max-[375px]:leading-7">
          Review grouped duplicates and prepare safe keep/remove decisions before export.
        </p>
      </header>

      <section *ngIf="!store.snapshot()" class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <p>No workspace loaded yet.</p>
        <a routerLink="/import" class="mt-4 inline-flex rounded-xl bg-white px-4 py-2 font-semibold text-slate-950">
          Import bookmarks
        </a>
      </section>

      <ng-container *ngIf="store.snapshot()">
        <section class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4" aria-label="Organize metrics">
          <article class="metric-card">
            <p class="metric-label">Duplicate groups</p>
            <p class="metric-value">{{ duplicateGroups().length }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Links in groups</p>
            <p class="metric-value">{{ duplicateLinksCount() }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Exact URL groups</p>
            <p class="metric-value">{{ exactMatchGroupCount() }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Host+title groups</p>
            <p class="metric-value">{{ hostTitleGroupCount() }}</p>
          </article>
        </section>

        <section class="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-6">
          <header>
            <h2 class="text-xl font-semibold">Proposed duplicate groups</h2>
            <p class="text-sm text-slate-300">
              MVP placeholder: next pass will add keep/remove toggles and final apply preview.
            </p>
          </header>

          <div *ngIf="duplicateGroups().length === 0" class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            No duplicate groups detected from current heuristics.
          </div>

          <div class="space-y-3" *ngIf="duplicateGroups().length > 0">
            <article
              *ngFor="let group of duplicateGroups().slice(0, 12)"
              class="rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:p-4"
            >
              <p class="text-sm font-semibold text-slate-100">
                {{ group.reason === 'NORMALIZED_URL' ? 'Exact URL match' : 'Host + title match' }}
                <span class="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{{ group.items.length }} links</span>
              </p>
              <ul class="mt-2 space-y-1 text-xs text-slate-300">
                <li *ngFor="let item of group.items.slice(0, 4)">
                  {{ item.title }} · {{ item.host }}
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section class="flex flex-wrap gap-3">
          <a
            routerLink="/dashboard"
            class="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200"
          >
            Back to review
          </a>
          <button
            type="button"
            class="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            disabled
            aria-disabled="true"
          >
            Export prep (next)
          </button>
        </section>
      </ng-container>
    </section>
  `,
})
export class OrganizePageComponent {
  readonly store = inject(WorkspaceStore);

  readonly duplicateGroups = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return [];
    }
    return detectDuplicateGroups(snapshot.bookmarks);
  });

  readonly duplicateLinksCount = computed(() =>
    this.duplicateGroups().reduce((sum, group) => sum + group.items.length, 0),
  );

  readonly exactMatchGroupCount = computed(
    () => this.duplicateGroups().filter((group) => group.reason === 'NORMALIZED_URL').length,
  );

  readonly hostTitleGroupCount = computed(
    () => this.duplicateGroups().filter((group) => group.reason === 'HOST_AND_TITLE').length,
  );
}
