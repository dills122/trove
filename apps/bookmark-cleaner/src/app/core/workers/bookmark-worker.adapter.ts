import type { WorkerRequest } from './bookmark-worker.types';

export interface BookmarkWorkerAdapter {
  postMessage(message: WorkerRequest): void;
  setMessageHandler(handler: ((data: unknown) => void) | null): void;
  setErrorHandler(handler: ((error: unknown) => void) | null): void;
  terminate(): void;
}

export type BookmarkWorkerFactory = () => BookmarkWorkerAdapter | Promise<BookmarkWorkerAdapter>;
