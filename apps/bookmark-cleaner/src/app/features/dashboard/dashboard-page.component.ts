import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calculateDuplicateMetrics } from '../../core/analysis/duplicate-metrics';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
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

  readonly duplicateMetrics = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return calculateDuplicateMetrics([]);
    }
    return calculateDuplicateMetrics(snapshot.bookmarks);
  });

  readonly duplicateGroups = computed(() => this.duplicateMetrics().groups);
  readonly duplicateLinksCount = computed(() => this.duplicateMetrics().linksCount);
  readonly potentialRemovals = computed(() => this.duplicateMetrics().potentialRemovals);
  readonly largestDuplicateGroup = computed(() => this.duplicateMetrics().largestGroupSize);

  readonly duplicateCoveragePercent = computed(() => {
    const total = this.store.snapshot()?.analysis.totalBookmarks ?? 0;
    if (total === 0) {
      return 0;
    }
    return Math.round((this.duplicateLinksCount() / total) * 100);
  });

  readonly exactDuplicateGroupCount = computed(() => this.duplicateMetrics().exactGroupCount);
  readonly intentDuplicateGroupCount = computed(() => this.duplicateMetrics().hostTitleGroupCount);

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
