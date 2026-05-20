import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 max-[375px]:space-y-4 max-[375px]:px-3.5 sm:space-y-8 sm:px-6 sm:py-10">
      <header class="space-y-3">
        <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Step 2 • Review</p>
        <h1 class="text-3xl font-semibold tracking-tight max-[375px]:text-[2rem] max-[375px]:leading-[1.1] sm:text-4xl">See what your data is telling you</h1>
        <p class="max-w-3xl text-base text-slate-300 max-[375px]:text-[1.02rem] max-[375px]:leading-7">
          Use this snapshot to decide whether to move into duplicate cleanup and organization.
        </p>
      </header>

      <section
        *ngIf="!store.snapshot()"
        class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300"
      >
        <p>No workspace loaded yet.</p>
        <a routerLink="/import" class="mt-4 inline-flex rounded-xl bg-white px-4 py-2 font-semibold text-slate-950">
          Import bookmarks
        </a>
      </section>

      <ng-container *ngIf="store.snapshot() as snapshot">
        <section class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4" aria-label="Key metrics">
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
        </section>

        <section class="grid gap-4 max-[375px]:gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <article class="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-6">
            <h2 class="text-xl font-semibold">Quality insight</h2>
            <ul class="space-y-2 text-sm text-slate-200">
              <li class="flex items-center justify-between">
                <span>Malformed entries</span>
                <strong>{{ snapshot.analysis.malformedEntries }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Warning count</span>
                <strong>{{ snapshot.analysis.warningCount }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Bookmarklets</span>
                <strong>{{ snapshot.analysis.bookmarkletCount }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Uniqueness ratio</span>
                <strong>{{ uniqueRatio() }}%</strong>
              </li>
            </ul>
            <p class="text-sm text-slate-300">{{ guidance() }}</p>
          </article>

          <article class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 max-[375px]:p-3.5 sm:p-6">
            <h2 class="text-xl font-semibold">What to do next</h2>
            <ol class="space-y-2 text-sm text-slate-200">
              <li>1. Review warnings from import.</li>
              <li>2. Start duplicate detection and triage.</li>
              <li>3. Build a proposed folder organization.</li>
            </ol>
            <div class="flex flex-wrap gap-3 pt-2">
              <a routerLink="/import" class="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 min-h-11 inline-flex items-center">
                Re-import file
              </a>
              <button
                type="button"
                class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 min-h-11"
                disabled
                aria-disabled="true"
              >
                Duplicates (coming next)
              </button>
            </div>
          </article>
        </section>

        <section class="grid gap-4 max-[375px]:gap-3 lg:grid-cols-3">
          <article class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-5">
            <h3 class="text-lg font-semibold">Scheme mix</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-200">
              <li class="flex items-center justify-between" *ngFor="let item of visibleSchemes()">
                <span>{{ item.key }}</span>
                <strong class="shrink-0">{{ item.count }}</strong>
              </li>
            </ul>
            <button
              *ngIf="hasMoreSchemes()"
              type="button"
              class="mt-3 inline-flex min-h-10 items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 lg:hidden"
              (click)="showAllSchemes.set(!showAllSchemes())"
            >
              {{ showAllSchemes() ? 'Show less' : 'Show more' }}
            </button>
          </article>

          <article class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-5">
            <h3 class="text-lg font-semibold">Top hosts (include subdomains)</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-200 lg:max-h-64 lg:overflow-auto">
              <li class="flex items-center justify-between" *ngFor="let item of visibleHosts()">
                <span class="mr-2 min-w-0 truncate" [title]="item.key">{{ item.key }}</span>
                <strong class="shrink-0">{{ item.count }}</strong>
              </li>
            </ul>
            <button
              *ngIf="hasMoreHosts()"
              type="button"
              class="mt-3 inline-flex min-h-10 items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 lg:hidden"
              (click)="showAllHosts.set(!showAllHosts())"
            >
              {{ showAllHosts() ? 'Show less' : 'Show more' }}
            </button>
          </article>

          <article class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-5">
            <h3 class="text-lg font-semibold">Top shared domains (exclude subdomains)</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-200 lg:max-h-64 lg:overflow-auto">
              <li class="flex items-center justify-between" *ngFor="let item of visibleDomains()">
                <span class="mr-2 min-w-0 truncate" [title]="item.key">{{ item.key }}</span>
                <strong class="shrink-0">{{ item.count }}</strong>
              </li>
            </ul>
            <button
              *ngIf="hasMoreDomains()"
              type="button"
              class="mt-3 inline-flex min-h-10 items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 lg:hidden"
              (click)="showAllDomains.set(!showAllDomains())"
            >
              {{ showAllDomains() ? 'Show less' : 'Show more' }}
            </button>
          </article>
        </section>
      </ng-container>
    </section>
  `,
})
export class DashboardPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly mobileListLimit = 8;
  readonly showAllSchemes = signal(false);
  readonly showAllHosts = signal(false);
  readonly showAllDomains = signal(false);

  readonly uniqueRatio = computed(() => {
    const analysis = this.store.snapshot()?.analysis;
    if (!analysis || analysis.totalBookmarks === 0) {
      return 0;
    }

    return Math.round((analysis.uniqueUrls / analysis.totalBookmarks) * 100);
  });

  readonly guidance = computed(() => {
    const ratio = this.uniqueRatio();

    if (ratio >= 85) {
      return 'Your bookmarks look relatively distinct. Focus on warnings first, then organization.';
    }

    if (ratio >= 60) {
      return 'There is moderate overlap. Duplicate review will likely produce useful cleanup wins.';
    }

    return 'High overlap detected. Prioritize duplicate review before folder organization.';
  });

  readonly visibleHosts = computed(() => {
    const items = this.store.snapshot()?.analysis.topHosts ?? [];
    return this.showAllHosts() ? items : items.slice(0, this.mobileListLimit);
  });

  readonly visibleDomains = computed(() => {
    const items = this.store.snapshot()?.analysis.topRegistrableDomains ?? [];
    return this.showAllDomains() ? items : items.slice(0, this.mobileListLimit);
  });

  readonly hasMoreHosts = computed(
    () => (this.store.snapshot()?.analysis.topHosts.length ?? 0) > this.mobileListLimit,
  );

  readonly hasMoreDomains = computed(
    () => (this.store.snapshot()?.analysis.topRegistrableDomains.length ?? 0) > this.mobileListLimit,
  );

  readonly visibleSchemes = computed(() => {
    const items = this.store.snapshot()?.analysis.schemeBreakdown ?? [];
    return this.showAllSchemes() ? items : items.slice(0, this.mobileListLimit);
  });

  readonly hasMoreSchemes = computed(
    () => (this.store.snapshot()?.analysis.schemeBreakdown.length ?? 0) > this.mobileListLimit,
  );
}
