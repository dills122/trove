import type { BookmarkFolder, BookmarkWorkspaceSnapshot } from '../models/bookmark.models';

export type WorkerRequest =
  | {
      type: 'PARSE_BOOKMARK_HTML';
      payload: {
        html: string;
      };
    }
  | {
      type: 'ANALYZE_BOOKMARKS';
      payload: {
        root: BookmarkFolder;
      };
    };

export type WorkerResponse =
  | {
      type: 'PARSE_COMPLETE';
      payload: BookmarkWorkspaceSnapshot;
    }
  | {
      type: 'WORKER_ERROR';
      error: {
        message: string;
      };
    };
