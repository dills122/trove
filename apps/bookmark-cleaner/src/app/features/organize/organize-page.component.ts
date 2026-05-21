import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calculateDuplicateMetrics } from '../../core/analysis/duplicate-metrics';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-organize-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organize-page.component.html',
  styleUrl: './organize-page.component.scss',
})
export class OrganizePageComponent {
  readonly store = inject(WorkspaceStore);

  readonly duplicateMetrics = computed(() => {
    const snapshot = this.store.snapshot();
    if (!snapshot) {
      return calculateDuplicateMetrics([]);
    }
    return calculateDuplicateMetrics(snapshot.bookmarks);
  });

  readonly duplicateGroups = computed(() => this.duplicateMetrics().groups);
  readonly duplicateLinksCount = computed(() => this.duplicateMetrics().linksCount);
  readonly exactMatchGroupCount = computed(() => this.duplicateMetrics().exactGroupCount);
  readonly hostTitleGroupCount = computed(() => this.duplicateMetrics().hostTitleGroupCount);
}
