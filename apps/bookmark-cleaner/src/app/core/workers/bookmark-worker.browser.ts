import type { BookmarkWorkerAdapter, BookmarkWorkerFactory } from './bookmark-worker.adapter';

export const createBrowserBookmarkWorker: BookmarkWorkerFactory = () => {
  const worker = new Worker(new URL('./bookmark-engine.worker', import.meta.url), {
    type: 'module',
  });

  const adapter: BookmarkWorkerAdapter = {
    postMessage: (message) => worker.postMessage(message),
    setMessageHandler: (handler) => {
      worker.onmessage = handler ? ({ data }: MessageEvent<unknown>) => handler(data) : null;
    },
    setErrorHandler: (handler) => {
      worker.onerror = handler ? (event: ErrorEvent) => handler(event.error) : null;
    },
    terminate: () => worker.terminate(),
  };

  return adapter;
};
