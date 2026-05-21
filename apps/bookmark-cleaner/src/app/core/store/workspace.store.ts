import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import type { AsyncStatus } from './foundation/store-contracts';
import { workspacePersistenceAdapter } from './workspace-persistence';

interface WorkspaceState {
  snapshot: BookmarkWorkspaceSnapshot | null;
  isProcessing: boolean;
  loadStatus: AsyncStatus;
  saveStatus: AsyncStatus;
  error: string | null;
}

const initialState: WorkspaceState = {
  snapshot: null,
  isProcessing: false,
  loadStatus: 'idle',
  saveStatus: 'idle',
  error: null,
};

export const WorkspaceStore = signalStore(
  { providedIn: 'root' },
  withState<WorkspaceState>(initialState),
  withComputed(({ snapshot }) => ({
    hasWorkspace: computed(() => snapshot() !== null),
  })),
  withMethods((store) => ({
    async load(): Promise<void> {
      patchState(store, { loadStatus: 'loading', error: null });
      try {
        const snapshot = await workspacePersistenceAdapter.read();
        patchState(store, { snapshot, loadStatus: 'success' });
      } catch {
        // Dexie may be unavailable in non-browser test environments.
        patchState(store, { loadStatus: 'error', error: 'Failed to load workspace snapshot.' });
      }
    },

    async save(snapshot: BookmarkWorkspaceSnapshot): Promise<void> {
      patchState(store, { saveStatus: 'loading', error: null });
      try {
        await workspacePersistenceAdapter.write(snapshot);
        patchState(store, { saveStatus: 'success' });
      } catch {
        // Save failures should not crash the import flow; memory state still updates.
        patchState(store, { saveStatus: 'error', error: 'Failed to persist workspace snapshot.' });
      }
      patchState(store, { snapshot });
    },

    setProcessing(isProcessing: boolean): void {
      patchState(store, { isProcessing });
    },
  })),
);
