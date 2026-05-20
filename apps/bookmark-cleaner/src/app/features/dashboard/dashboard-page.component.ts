import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { detectDuplicateGroups } from '../../core/analysis/duplicate-detection';
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
              <a
                routerLink="/organize"
                class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 min-h-11 inline-flex items-center"
              >
                Open organize step
              </a>
            </div>
          </article>
        </section>

        <section class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-6">
          <h2 class="text-xl font-semibold">Cleanup impact</h2>
          <p class="mt-1 text-sm text-slate-300">
            Estimated outcomes if duplicate groups are reviewed with one preferred bookmark kept per group.
          </p>
          <div class="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <article class="metric-card">
              <p class="metric-label">Potential removals</p>
              <p class="metric-value">{{ potentialRemovals() }}</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Largest group</p>
              <p class="metric-value">{{ largestDuplicateGroup() }}</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Duplicate groups</p>
              <p class="metric-value">{{ duplicateGroups().length }}</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">% in groups</p>
              <p class="metric-value">{{ duplicateCoveragePercent() }}%</p>
            </article>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:flex sm:flex-wrap sm:gap-3">
            <span class="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">Exact URL groups: {{ exactDuplicateGroupCount() }}</span>
            <span class="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">Intent groups: {{ intentDuplicateGroupCount() }}</span>
          </div>
        </section>

        <section class="grid gap-4 max-[375px]:gap-3 lg:grid-cols-3">
          <article class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-5">
            <h3 class="text-lg font-semibold">Domain dependency</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-200">
              <li class="flex items-center justify-between">
                <span>Top 5 share</span>
                <strong class="shrink-0">{{ topFiveDomainSharePercent() }}%</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Top 1 dependency</span>
                <strong class="shrink-0">{{ topDomainSharePercent() }}%</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Distinct hosts</span>
                <strong class="shrink-0">{{ hostDiversity() }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Shared domains</span>
                <strong class="shrink-0">{{ registrableDomainDiversity() }}</strong>
              </li>
            </ul>
            <p class="mt-3 text-xs text-slate-400">{{ dependencySignal() }}</p>
          </article>

          <article class="rounded-3xl border border-white/10 bg-slate-900/60 p-4 max-[375px]:p-3.5 sm:p-5">
            <h3 class="text-lg font-semibold">Structure insights</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-200">
              <li class="flex items-center justify-between">
                <span>Avg links per folder</span>
                <strong class="shrink-0">{{ avgLinksPerFolder() }}</strong>
              </li>
              <li class="flex items-center justify-between">
                <span>Deepest folder depth</span>
                <strong class="shrink-0">{{ deepestFolderDepth() }}</strong>
              </li>
            </ul>
            <p class="mt-3 text-xs text-slate-400">
              Protocol mix:
              <span *ngFor="let item of protocolChips(); let last = last">
                {{ item.key }} {{ item.count }}<span *ngIf="!last">, </span>
              </span>
            </p>
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
    const duplicates = this.duplicateGroups().length;

    if (duplicates > 0) {
      return `${duplicates} duplicate groups found. Continue to Organize for keep/remove planning.`;
    }

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

  readonly potentialRemovals = computed(() =>
    this.duplicateGroups().reduce((sum, group) => sum + Math.max(0, group.items.length - 1), 0),
  );

  readonly largestDuplicateGroup = computed(() =>
    this.duplicateGroups().reduce((max, group) => Math.max(max, group.items.length), 0),
  );

  readonly duplicateCoveragePercent = computed(() => {
    const total = this.store.snapshot()?.analysis.totalBookmarks ?? 0;
    if (total === 0) {
      return 0;
    }
    return Math.round((this.duplicateLinksCount() / total) * 100);
  });

  readonly exactDuplicateGroupCount = computed(
    () => this.duplicateGroups().filter((group) => group.reason === 'NORMALIZED_URL').length,
  );

  readonly intentDuplicateGroupCount = computed(
    () => this.duplicateGroups().filter((group) => group.reason === 'HOST_AND_TITLE').length,
  );

  readonly hostDiversity = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return 0;
    }
    return new Set(snapshot.bookmarks.map((bookmark) => bookmark.host)).size;
  });

  readonly registrableDomainDiversity = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return 0;
    }
    return new Set(snapshot.bookmarks.map((bookmark) => bookmark.registrableDomain)).size;
  });

  readonly avgLinksPerFolder = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot || snapshot.analysis.totalFolders === 0) {
      return 0;
    }
    return Math.round((snapshot.analysis.totalBookmarks / snapshot.analysis.totalFolders) * 10) / 10;
  });

  readonly deepestFolderDepth = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return 0;
    }
    return snapshot.bookmarks.reduce((max, bookmark) => Math.max(max, bookmark.path.length), 0);
  });

  readonly protocolChips = computed(() => (this.store.snapshot()?.analysis.schemeBreakdown ?? []).slice(0, 4));

  readonly topFiveDomainSharePercent = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot || snapshot.analysis.totalBookmarks === 0) {
      return 0;
    }
    const topFiveCount = snapshot.analysis.topRegistrableDomains
      .slice(0, 5)
      .reduce((sum, item) => sum + item.count, 0);
    return Math.round((topFiveCount / snapshot.analysis.totalBookmarks) * 100);
  });

  readonly topDomainSharePercent = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot || snapshot.analysis.totalBookmarks === 0) {
      return 0;
    }
    const topDomainCount = snapshot.analysis.topRegistrableDomains[0]?.count ?? 0;
    return Math.round((topDomainCount / snapshot.analysis.totalBookmarks) * 100);
  });

  readonly cleanupIndex = computed(() => {
    const duplicateWeight = Math.min(100, this.duplicateCoveragePercent() * 1.4);
    const warningWeight = Math.min(100, (this.store.snapshot()?.analysis.warningCount ?? 0) * 2);
    const dependencyWeight = Math.min(100, this.topFiveDomainSharePercent() * 1.1);
    return Math.round((duplicateWeight * 0.5 + warningWeight * 0.2 + dependencyWeight * 0.3) * 10) / 10;
  });

  readonly dependencySignal = computed(() => {
    const topFiveShare = this.topFiveDomainSharePercent();
    const topOneShare = this.topDomainSharePercent();
    const index = this.cleanupIndex();
    return `Top 5 domains account for ${topFiveShare}% of links; top domain alone is ${topOneShare}%. Cleanup index: ${index}.`;
  });
}
