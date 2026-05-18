import Dexie, { type Table } from 'dexie';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';

export interface StoredWorkspace {
  id: string;
  createdAt: string;
  updatedAt: string;
  snapshot: BookmarkWorkspaceSnapshot;
}

export interface AppSetting {
  key: string;
  value: unknown;
}

export class BookmarkCleanerDb extends Dexie {
  workspaces!: Table<StoredWorkspace, string>;
  settings!: Table<AppSetting, string>;

  public constructor() {
    super('bookmark-cleaner-db');

    this.version(1).stores({
      workspaces: 'id,updatedAt',
      settings: 'key',
    });
  }
}

export const appDb = new BookmarkCleanerDb();
