import { TestBed } from '@angular/core/testing';
import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import {
  BOOKMARK_WORKER_PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from '../workers/bookmark-worker.types';
import {
  BOOKMARK_WORKER_FACTORY,
  type BookmarkWorkerAdapter,
  BookmarkWorkerService,
} from './bookmark-worker.service';

class FakeBookmarkWorker implements BookmarkWorkerAdapter {
  readonly postedMessages: WorkerRequest[] = [];
  messageHandler: ((data: unknown) => void) | null = null;
  errorHandler: ((error: unknown) => void) | null = null;
  terminationCount = 0;

  postMessage(message: WorkerRequest): void {
    this.postedMessages.push(message);
  }

  setMessageHandler(handler: ((data: unknown) => void) | null): void {
    this.messageHandler = handler;
  }

  setErrorHandler(handler: ((error: unknown) => void) | null): void {
    this.errorHandler = handler;
  }

  terminate(): void {
    this.terminationCount += 1;
  }

  emitMessage(data: unknown): void {
    this.messageHandler?.(data);
  }

  emitError(error: unknown): void {
    this.errorHandler?.(error);
  }
}

describe('BookmarkWorkerService', () => {
  const snapshot: BookmarkWorkspaceSnapshot = {
    originalTree: { id: 'root', type: 'folder', title: 'Bookmarks', path: [], children: [] },
    bookmarks: [],
    analysis: {
      totalBookmarks: 0,
      totalFolders: 1,
      uniqueUrls: 0,
      malformedEntries: 0,
      warningCount: 0,
      bookmarkletCount: 0,
      schemeBreakdown: [],
      topHosts: [],
      topRegistrableDomains: [],
    },
    warnings: [],
  };

  let service: BookmarkWorkerService;
  let worker: FakeBookmarkWorker;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.resetTestingModule();
    worker = new FakeBookmarkWorker();
    TestBed.configureTestingModule({
      providers: [{ provide: BOOKMARK_WORKER_FACTORY, useValue: () => worker }],
    });
    service = TestBed.inject(BookmarkWorkerService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('preserves parse(html) and resolves a validated versioned success response', async () => {
    const result = service.parse('<DL></DL>');
    const request = await postedRequest();

    expect(request).toMatchObject({
      protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
      operation: 'parse-bookmark-html',
      type: 'request',
      payload: { html: '<DL></DL>' },
    });

    worker.emitMessage(successResponse(request));

    await expect(result).resolves.toBe(snapshot);
    expect(worker.terminationCount).toBe(1);
  });

  it('reports bounded progress without settling the parse operation', async () => {
    const onProgress = jest.fn();
    const result = service.parse('<DL></DL>', { onProgress });
    const request = await postedRequest();

    worker.emitMessage({
      ...responseEnvelope(request),
      type: 'progress',
      progress: { phase: 'parsing', percent: 40 },
    } satisfies WorkerResponse);
    expect(onProgress).toHaveBeenCalledWith({ phase: 'parsing', percent: 40 });
    expect(worker.terminationCount).toBe(0);

    worker.emitMessage(successResponse(request));
    await expect(result).resolves.toBe(snapshot);
  });

  it('rejects a malformed response and cleans up the worker', async () => {
    const result = service.parse('<DL></DL>');
    const request = await postedRequest();

    worker.emitMessage({ ...responseEnvelope(request), type: 'success', payload: null });

    await expect(result).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expectCleanedUp();
  });

  it('translates worker errors without exposing the raw error', async () => {
    const result = service.parse('<DL></DL>');
    await postedRequest();

    worker.emitError(new Error('raw worker detail'));

    await expect(result).rejects.toMatchObject({
      code: 'WORKER_FAILURE',
      message: 'Bookmark parsing stopped unexpectedly. Please try again.',
    });
    expectCleanedUp();
  });

  it('cancels by terminating and ignores a late success response', async () => {
    const controller = new AbortController();
    const result = service.parse('<DL></DL>', { signal: controller.signal });
    const request = await postedRequest();
    const lateMessageHandler = worker.messageHandler;

    controller.abort();
    lateMessageHandler?.(successResponse(request));

    await expect(result).rejects.toMatchObject({ code: 'CANCELLED' });
    expectCleanedUp();
  });

  it('times out by terminating and ignores a late success response', async () => {
    const result = service.parse('<DL></DL>', { timeoutMs: 100 });
    const request = await postedRequest();
    const lateMessageHandler = worker.messageHandler;

    jest.advanceTimersByTime(100);
    lateMessageHandler?.(successResponse(request));

    await expect(result).rejects.toMatchObject({ code: 'TIMEOUT' });
    expectCleanedUp();
  });

  it('removes handlers and clears the timeout after success', async () => {
    const result = service.parse('<DL></DL>', { timeoutMs: 100 });
    const request = await postedRequest();

    worker.emitMessage(successResponse(request));
    await expect(result).resolves.toBe(snapshot);
    jest.advanceTimersByTime(100);

    expectCleanedUp();
    expect(worker.terminationCount).toBe(1);
  });

  it('ignores stale and wrong-requestId messages until the matching response arrives', async () => {
    const result = service.parse('<DL></DL>');
    const request = await postedRequest();
    let settled = false;
    void result.finally(() => {
      settled = true;
    });

    worker.emitMessage({
      ...successResponse(request),
      requestId: 'stale-request',
    });
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(worker.terminationCount).toBe(0);

    worker.emitMessage(successResponse(request));
    await expect(result).resolves.toBe(snapshot);
  });

  it('translates a structured worker error response', async () => {
    const result = service.parse('<DL></DL>');
    const request = await postedRequest();

    worker.emitMessage({
      ...responseEnvelope(request),
      type: 'error',
      error: {
        code: 'PARSE_FAILED',
        message: 'Trove could not parse this bookmark file.',
        retryable: false,
      },
    } satisfies WorkerResponse);

    await expect(result).rejects.toMatchObject({
      code: 'PARSE_FAILED',
      message: 'Trove could not parse this bookmark file.',
    });
    expectCleanedUp();
  });

  async function postedRequest(): Promise<WorkerRequest> {
    await Promise.resolve();
    const request = worker.postedMessages[0];
    if (!request) {
      throw new Error('Expected the service to post a worker request');
    }
    return request;
  }

  function responseEnvelope(request: WorkerRequest) {
    return {
      protocolVersion: request.protocolVersion,
      requestId: request.requestId,
      operation: request.operation,
    } as const;
  }

  function successResponse(request: WorkerRequest): WorkerResponse {
    return { ...responseEnvelope(request), type: 'success', payload: snapshot };
  }

  function expectCleanedUp(): void {
    expect(worker.messageHandler).toBeNull();
    expect(worker.errorHandler).toBeNull();
    expect(worker.terminationCount).toBe(1);
  }
});
