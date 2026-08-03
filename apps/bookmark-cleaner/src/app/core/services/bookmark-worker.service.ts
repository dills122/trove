import { inject, Injectable, InjectionToken } from '@angular/core';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import type {
  BookmarkWorkerAdapter,
  BookmarkWorkerFactory,
} from '../workers/bookmark-worker.adapter';
import {
  BOOKMARK_WORKER_PROTOCOL_VERSION,
  getWorkerMessageRequestId,
  isWorkerResponse,
  type BookmarkWorkerErrorCode,
  type WorkerProgress,
} from '../workers/bookmark-worker.types';

export type {
  BookmarkWorkerAdapter,
  BookmarkWorkerFactory,
} from '../workers/bookmark-worker.adapter';

export interface ParseWorkerOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: WorkerProgress) => void;
}

export type BookmarkWorkerServiceErrorCode =
  | BookmarkWorkerErrorCode
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'WORKER_FAILURE';

export class BookmarkWorkerServiceError extends Error {
  constructor(
    readonly code: BookmarkWorkerServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'BookmarkWorkerServiceError';
  }
}

export const BOOKMARK_WORKER_FACTORY = new InjectionToken<BookmarkWorkerFactory>(
  'BOOKMARK_WORKER_FACTORY',
  {
    providedIn: 'root',
    factory: () => async () => {
      const { createBrowserBookmarkWorker } = await import('../workers/bookmark-worker.browser');
      return createBrowserBookmarkWorker();
    },
  }
);

@Injectable({ providedIn: 'root' })
export class BookmarkWorkerService {
  private static readonly DEFAULT_TIMEOUT_MS = 30_000;

  private readonly createWorker = inject(BOOKMARK_WORKER_FACTORY);
  private nextRequestSequence = 0;

  parse(html: string, options: ParseWorkerOptions = {}): Promise<BookmarkWorkspaceSnapshot> {
    if (options.signal?.aborted) {
      return Promise.reject(
        new BookmarkWorkerServiceError('CANCELLED', 'Bookmark parsing was cancelled.')
      );
    }

    return new Promise((resolve, reject) => {
      const requestId = this.createRequestId();
      let worker: BookmarkWorkerAdapter | null = null;
      let settled = false;
      const timeoutMs = this.resolveTimeout(options.timeoutMs);

      const cleanup = (): void => {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener('abort', handleAbort);
        worker?.setMessageHandler(null);
        worker?.setErrorHandler(null);
        worker?.terminate();
      };

      const complete = (snapshot: BookmarkWorkspaceSnapshot): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(snapshot);
      };

      const fail = (error: BookmarkWorkerServiceError): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      };

      const handleMessage = (data: unknown): void => {
        if (settled) {
          return;
        }

        const responseRequestId = getWorkerMessageRequestId(data);
        if (responseRequestId !== null && responseRequestId !== requestId) {
          return;
        }

        if (!isWorkerResponse(data) || data.requestId !== requestId) {
          fail(
            new BookmarkWorkerServiceError(
              'INVALID_RESPONSE',
              'Trove received an invalid response while parsing bookmarks.'
            )
          );
          return;
        }

        switch (data.type) {
          case 'progress':
            this.reportProgress(options.onProgress, data.progress);
            return;
          case 'success':
            complete(data.payload);
            return;
          case 'error':
            fail(new BookmarkWorkerServiceError(data.error.code, data.error.message));
        }
      };

      const handleWorkerError = (): void => {
        fail(
          new BookmarkWorkerServiceError(
            'WORKER_FAILURE',
            'Bookmark parsing stopped unexpectedly. Please try again.'
          )
        );
      };

      function handleAbort(): void {
        fail(new BookmarkWorkerServiceError('CANCELLED', 'Bookmark parsing was cancelled.'));
      }

      options.signal?.addEventListener('abort', handleAbort, { once: true });
      const timeoutId = setTimeout(() => {
        fail(
          new BookmarkWorkerServiceError(
            'TIMEOUT',
            'Bookmark parsing took too long and was stopped. Please try again.'
          )
        );
      }, timeoutMs);

      const initializeWorker = async (): Promise<void> => {
        try {
          const createdWorker = await this.createWorker();
          if (settled) {
            createdWorker.terminate();
            return;
          }

          worker = createdWorker;
          worker.setMessageHandler(handleMessage);
          worker.setErrorHandler(handleWorkerError);
          worker.postMessage({
            protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
            requestId,
            operation: 'parse-bookmark-html',
            type: 'request',
            payload: { html },
          });
        } catch {
          fail(
            new BookmarkWorkerServiceError(
              'WORKER_FAILURE',
              'Trove could not start bookmark parsing.'
            )
          );
        }
      };

      void initializeWorker();
    });
  }

  private createRequestId(): string {
    this.nextRequestSequence += 1;
    return `parse-v${BOOKMARK_WORKER_PROTOCOL_VERSION}-${this.nextRequestSequence}`;
  }

  private resolveTimeout(timeoutMs: number | undefined): number {
    if (timeoutMs === undefined || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return BookmarkWorkerService.DEFAULT_TIMEOUT_MS;
    }
    return timeoutMs;
  }

  private reportProgress(
    onProgress: ParseWorkerOptions['onProgress'],
    progress: WorkerProgress
  ): void {
    try {
      onProgress?.(progress);
    } catch {
      // Consumer presentation callbacks must not break worker lifecycle cleanup.
    }
  }
}
