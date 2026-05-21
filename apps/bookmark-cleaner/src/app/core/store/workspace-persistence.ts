import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import { appDb } from '../storage/app-db';
import type { ReadablePersistenceAdapter, WritablePersistenceAdapter } from './foundation/persistence-adapter';

const DEFAULT_WORKSPACE_ID = 'active-workspace';

export interface WorkspacePersistenceAdapter
  extends ReadablePersistenceAdapter<BookmarkWorkspaceSnapshot>,
    WritablePersistenceAdapter<BookmarkWorkspaceSnapshot> {}

export const workspacePersistenceAdapter: WorkspacePersistenceAdapter = {
  async read(): Promise<BookmarkWorkspaceSnapshot | null> {
    const workspace = await appDb.workspaces.get(DEFAULT_WORKSPACE_ID);
    return workspace?.snapshot ?? null;
  },

  async write(snapshot: BookmarkWorkspaceSnapshot): Promise<boolean> {
    const now = new Date().toISOString();
    await appDb.workspaces.put({
      id: DEFAULT_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
      snapshot,
    });
    return true;
  },
};
