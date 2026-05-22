import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DecisionStrategy } from '../../core/store/organize.store';
import { OrganizeStore } from '../../core/store/organize.store';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-organize-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organize-page.component.html',
  styleUrl: './organize-page.component.scss',
})
export class OrganizePageComponent {
  readonly workspaceStore = inject(WorkspaceStore);
  readonly organizeStore = inject(OrganizeStore);

  public constructor() {
    effect(() => {
      const bookmarks = this.workspaceStore.snapshot()?.bookmarks ?? [];
      this.organizeStore.initializeFromBookmarks(bookmarks);
    });
  }

  applyGroupStrategy(groupId: string, strategy: DecisionStrategy): void {
    this.organizeStore.applyStrategy(groupId, strategy);
  }

  resetGroup(groupId: string): void {
    this.organizeStore.resetGroup(groupId);
  }

  applyExactToAll(strategy: Exclude<DecisionStrategy, 'skip'>): void {
    this.organizeStore.bulkApplyExact(strategy);
  }

  groupDecisionLabel(groupId: string): string {
    const decision = this.organizeStore.decisions()[groupId];
    if (!decision) {
      return 'Unreviewed';
    }

    if (decision.strategy === 'skip') {
      return 'Skipped';
    }

    if (decision.strategy === 'keep_all') {
      return 'Keep all';
    }

    if (decision.strategy === 'keep_last') {
      return 'Keep last';
    }

    if (decision.strategy === 'keep_first') {
      return 'Keep first';
    }

    return 'Reviewed';
  }
}
