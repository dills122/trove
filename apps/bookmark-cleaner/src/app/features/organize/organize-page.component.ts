import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DecisionStrategy } from '../../core/store/organize.store';
import { OrganizeStore } from '../../core/store/organize.store';
import { WorkspaceStore } from '../../core/store/workspace.store';
import type { DuplicateGroup } from '../../core/analysis/duplicate-detection';

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
  readonly statusFilter = signal<'all' | 'unreviewed' | 'reviewed' | 'skipped'>('all');
  readonly selectedByGroup = signal<Record<string, string[]>>({});

  readonly filteredGroups = computed(() => {
    const filter = this.statusFilter();
    const groups = this.organizeStore.groups();
    const decisions = this.organizeStore.decisions();

    if (filter === 'all') {
      return groups;
    }

    if (filter === 'unreviewed') {
      return groups.filter((group) => !decisions[group.id]);
    }

    if (filter === 'skipped') {
      return groups.filter((group) => decisions[group.id]?.strategy === 'skip');
    }

    return groups.filter((group) => !!decisions[group.id] && decisions[group.id].strategy !== 'skip');
  });

  public constructor() {
    effect(() => {
      const bookmarks = this.workspaceStore.snapshot()?.bookmarks ?? [];
      this.organizeStore.initializeFromBookmarks(bookmarks);
      this.selectedByGroup.set({});
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

  setStatusFilter(value: 'all' | 'unreviewed' | 'reviewed' | 'skipped'): void {
    this.statusFilter.set(value);
  }

  isSelected(groupId: string, bookmarkId: string): boolean {
    return (this.selectedByGroup()[groupId] ?? []).includes(bookmarkId);
  }

  toggleSelected(groupId: string, bookmarkId: string): void {
    const current = this.selectedByGroup();
    const existing = current[groupId] ?? [];
    const next = existing.includes(bookmarkId)
      ? existing.filter((id) => id !== bookmarkId)
      : [...existing, bookmarkId];

    this.selectedByGroup.set({
      ...current,
      [groupId]: next,
    });
  }

  applyKeepSelected(group: DuplicateGroup): void {
    const selected = this.selectedByGroup()[group.id] ?? [];
    this.organizeStore.keepSelected(group.id, selected);
  }

  applyRemoveSelected(group: DuplicateGroup): void {
    const selected = this.selectedByGroup()[group.id] ?? [];
    this.organizeStore.removeSelected(group.id, selected);
  }
}
