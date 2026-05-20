import { Injectable, computed, signal } from '@angular/core';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import { appDb } from '../storage/app-db';

const DEFAULT_WORKSPACE_ID = 'active-workspace';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  readonly snapshot = signal<BookmarkWorkspaceSnapshot | null>(null);
  readonly isProcessing = signal(false);
  readonly hasWorkspace = computed(() => this.snapshot() !== null);

  async load(): Promise<void> {
    try {
      const workspace = await appDb.workspaces.get(DEFAULT_WORKSPACE_ID);
      if (workspace) {
        this.snapshot.set(workspace.snapshot);
      }
    } catch {
      // Dexie may be unavailable in non-browser test environments.
    }
  }

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
    this.snapshot.set(snapshot);
  }

  setProcessing(isProcessing: boolean): void {
    this.isProcessing.set(isProcessing);
  }
}
