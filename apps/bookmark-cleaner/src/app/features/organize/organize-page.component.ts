import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { detectDuplicateGroups } from '../../core/analysis/duplicate-detection';
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
