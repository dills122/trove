import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import { appDb } from '../storage/app-db';

const DEFAULT_WORKSPACE_ID = 'active-workspace';

interface WorkspaceState {
  snapshot: BookmarkWorkspaceSnapshot | null;
  isProcessing: boolean;
}

const initialState: WorkspaceState = {
  snapshot: null,
  isProcessing: false,
};

export const WorkspaceStore = signalStore(
  { providedIn: 'root' },
  withState<WorkspaceState>(initialState),
  withComputed(({ snapshot }) => ({
    hasWorkspace: computed(() => snapshot() !== null),
  })),
  withMethods((store) => ({
    async load(): Promise<void> {
      try {
        const workspace = await appDb.workspaces.get(DEFAULT_WORKSPACE_ID);
        if (workspace) {
          patchState(store, { snapshot: workspace.snapshot });
        }
      } catch {
        // Dexie may be unavailable in non-browser test environments.
      }
    },

    async save(snapshot: BookmarkWorkspaceSnapshot): Promise<void> {
      const now = new Date().toISOString();
      try {
        await appDb.workspaces.put({
          id: DEFAULT_WORKSPACE_ID,
          createdAt: now,
          updatedAt: now,
          snapshot,
        });
      } catch {
        // Save failures should not crash the import flow; memory state still updates.
      }
      patchState(store, { snapshot });
    },

    setProcessing(isProcessing: boolean): void {
      patchState(store, { isProcessing });
    },
  })),
);
