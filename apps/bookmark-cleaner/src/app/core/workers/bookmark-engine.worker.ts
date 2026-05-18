/// <reference lib="webworker" />

import { parseBookmarkHtml } from '../parsing/bookmark-parser';
import type { WorkerRequest, WorkerResponse } from './bookmark-worker.types';

addEventListener('message', ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    if (data.type === 'PARSE_BOOKMARK_HTML') {
      const payload = parseBookmarkHtml(data.payload.html);
      const response: WorkerResponse = { type: 'PARSE_COMPLETE', payload };
      postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'WORKER_ERROR',
      error: { message: error instanceof Error ? error.message : 'Unknown worker error' },
    };
    postMessage(response);
  }
});
