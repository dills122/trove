import { Injectable } from '@angular/core';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import type { WorkerRequest, WorkerResponse } from '../workers/bookmark-worker.types';

@Injectable({ providedIn: 'root' })
export class BookmarkWorkerService {
  parse(html: string): Promise<BookmarkWorkspaceSnapshot> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/bookmark-engine.worker', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        if (data.type === 'PARSE_COMPLETE') {
          resolve(data.payload);
        } else {
          reject(new Error(data.error.message));
        }
        worker.terminate();
      };

      worker.onerror = (event) => {
        reject(event.error ?? new Error('Worker failed'));
        worker.terminate();
      };

      const request: WorkerRequest = {
        type: 'PARSE_BOOKMARK_HTML',
        payload: { html },
      };

      worker.postMessage(request);
    });
  }
}
