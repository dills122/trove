import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { detectDuplicateGroups, type DuplicateGroup } from '../analysis/duplicate-detection';
import type { BookmarkLink } from '../models/bookmark.models';
import {
  createHistoryState,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
} from './foundation/history-state';

export type DecisionStatus = 'unreviewed' | 'accepted' | 'modified' | 'ignored';
export type DecisionStrategy = 'keep_first' | 'keep_last' | 'keep_all' | 'skip';

export interface GroupDecision {
  groupId: string;
  status: DecisionStatus;
  strategy: DecisionStrategy;
  keptIds: string[];
  removedIds: string[];
}

export type OrganizeAction =
  | { type: 'APPLY_STRATEGY'; groupId: string; strategy: DecisionStrategy }
  | { type: 'KEEP_SELECTED'; groupId: string; keptIds: string[] }
  | { type: 'REMOVE_SELECTED'; groupId: string; removedIds: string[] }
  | { type: 'RESET_GROUP'; groupId: string }
  | { type: 'BULK_APPLY_EXACT'; strategy: Exclude<DecisionStrategy, 'skip'> }
  | { type: 'UNDO' }
  | { type: 'REDO' };

interface OrganizeState {
  groups: DuplicateGroup[];
  totalBookmarks: number;
  sourceSignature: string | null;
  decisionHistory: HistoryState<Record<string, GroupDecision>>;
  actionLog: OrganizeAction[];
}

const createInitialState = (): OrganizeState => ({
  groups: [],
  totalBookmarks: 0,
  sourceSignature: null,
  decisionHistory: createHistoryState<Record<string, GroupDecision>>({}),
  actionLog: [],
});

const sourceSignatureFor = (bookmarks: BookmarkLink[]): string => {
  const first = bookmarks[0]?.id ?? 'none';
  const last = bookmarks[bookmarks.length - 1]?.id ?? 'none';
  return `${bookmarks.length}:${first}:${last}`;
};

const decisionForStrategy = (group: DuplicateGroup, strategy: DecisionStrategy): GroupDecision => {
  if (strategy === 'skip') {
    return {
      groupId: group.id,
      status: 'ignored',
      strategy,
      keptIds: group.items.map((item) => item.id),
      removedIds: [],
    };
  }

  if (strategy === 'keep_all') {
    return {
      groupId: group.id,
      status: 'accepted',
      strategy,
      keptIds: group.items.map((item) => item.id),
      removedIds: [],
    };
  }

  const keeper = strategy === 'keep_last' ? group.items[group.items.length - 1] : group.items[0];
  const keptIds = keeper ? [keeper.id] : [];
  const removedIds = group.items.map((item) => item.id).filter((id) => !keptIds.includes(id));

  return {
    groupId: group.id,
    status: 'accepted',
    strategy,
    keptIds,
    removedIds,
  };
};

export const OrganizeStore = signalStore(
  { providedIn: 'root' },
  withState<OrganizeState>(createInitialState()),
  withComputed((store) => ({
    decisions: computed(() => store.decisionHistory().present),
    reviewedCount: computed(() => Object.keys(store.decisionHistory().present).length),
    remainingCount: computed(() => Math.max(0, store.groups().length - Object.keys(store.decisionHistory().present).length)),
    canUndo: computed(() => store.decisionHistory().past.length > 0),
    canRedo: computed(() => store.decisionHistory().future.length > 0),
    projectedRemovalCount: computed(() =>
      Object.values(store.decisionHistory().present).reduce((sum, decision) => sum + decision.removedIds.length, 0),
    ),
    projectedKeptCount: computed(
      () => Math.max(0, store.totalBookmarks() - Object.values(store.decisionHistory().present).reduce((sum, d) => sum + d.removedIds.length, 0)),
    ),
    exactGroupsCount: computed(
      () => store.groups().filter((group) => group.reason === 'NORMALIZED_URL').length,
    ),
  })),
  withMethods((store) => ({
    initializeFromBookmarks(bookmarks: BookmarkLink[]): void {
      const signature = sourceSignatureFor(bookmarks);
      if (signature === store.sourceSignature()) {
        return;
      }

      patchState(store, {
        groups: detectDuplicateGroups(bookmarks),
        totalBookmarks: bookmarks.length,
        sourceSignature: signature,
        decisionHistory: createHistoryState<Record<string, GroupDecision>>({}),
        actionLog: [],
      });
    },

    applyStrategy(groupId: string, strategy: DecisionStrategy): void {
      const group = store.groups().find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      const nextDecision = decisionForStrategy(group, strategy);
      const nextDecisions = {
        ...store.decisionHistory().present,
        [groupId]: nextDecision,
      };

      patchState(store, {
        decisionHistory: pushHistory(store.decisionHistory(), nextDecisions),
        actionLog: [...store.actionLog(), { type: 'APPLY_STRATEGY', groupId, strategy }],
      });
    },

    keepSelected(groupId: string, keptIds: string[]): void {
      const group = store.groups().find((item) => item.id === groupId);
      if (!group || keptIds.length === 0) {
        return;
      }

      const validKept = group.items.map((item) => item.id).filter((id) => keptIds.includes(id));
      if (validKept.length === 0) {
        return;
      }

      const nextDecision: GroupDecision = {
        groupId,
        status: 'modified',
        strategy: 'keep_all',
        keptIds: validKept,
        removedIds: group.items.map((item) => item.id).filter((id) => !validKept.includes(id)),
      };

      const nextDecisions = {
        ...store.decisionHistory().present,
        [groupId]: nextDecision,
      };

      patchState(store, {
        decisionHistory: pushHistory(store.decisionHistory(), nextDecisions),
        actionLog: [...store.actionLog(), { type: 'KEEP_SELECTED', groupId, keptIds: validKept }],
      });
    },

    removeSelected(groupId: string, removedIds: string[]): void {
      const group = store.groups().find((item) => item.id === groupId);
      if (!group || removedIds.length === 0) {
        return;
      }

      const validRemoved = group.items.map((item) => item.id).filter((id) => removedIds.includes(id));
      const keptIds = group.items.map((item) => item.id).filter((id) => !validRemoved.includes(id));
      if (keptIds.length === 0) {
        return;
      }

      const nextDecision: GroupDecision = {
        groupId,
        status: 'modified',
        strategy: 'keep_all',
        keptIds,
        removedIds: validRemoved,
      };

      const nextDecisions = {
        ...store.decisionHistory().present,
        [groupId]: nextDecision,
      };

      patchState(store, {
        decisionHistory: pushHistory(store.decisionHistory(), nextDecisions),
        actionLog: [...store.actionLog(), { type: 'REMOVE_SELECTED', groupId, removedIds: validRemoved }],
      });
    },

    resetGroup(groupId: string): void {
      const current = store.decisionHistory().present;
      if (!current[groupId]) {
        return;
      }

      const nextDecisions = { ...current };
      delete nextDecisions[groupId];

      patchState(store, {
        decisionHistory: pushHistory(store.decisionHistory(), nextDecisions),
        actionLog: [...store.actionLog(), { type: 'RESET_GROUP', groupId }],
      });
    },

    bulkApplyExact(strategy: Exclude<DecisionStrategy, 'skip'>): void {
      const exactGroups = store.groups().filter((group) => group.reason === 'NORMALIZED_URL');
      if (exactGroups.length === 0) {
        return;
      }

      const nextDecisions = { ...store.decisionHistory().present };
      for (const group of exactGroups) {
        nextDecisions[group.id] = decisionForStrategy(group, strategy);
      }

      patchState(store, {
        decisionHistory: pushHistory(store.decisionHistory(), nextDecisions),
        actionLog: [...store.actionLog(), { type: 'BULK_APPLY_EXACT', strategy }],
      });
    },

    undo(): void {
      if (store.decisionHistory().past.length === 0) {
        return;
      }

      patchState(store, {
        decisionHistory: undoHistory(store.decisionHistory()),
        actionLog: [...store.actionLog(), { type: 'UNDO' }],
      });
    },

    redo(): void {
      if (store.decisionHistory().future.length === 0) {
        return;
      }

      patchState(store, {
        decisionHistory: redoHistory(store.decisionHistory()),
        actionLog: [...store.actionLog(), { type: 'REDO' }],
      });
    },
  })),
);
