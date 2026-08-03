import type { BookmarkWorkspaceSnapshot } from '../models/bookmark.models';
import { handleBookmarkWorkerRequest } from './bookmark-worker.protocol';
import {
  BOOKMARK_WORKER_PROTOCOL_VERSION,
  isWorkerRequest,
  isWorkerResponse,
  type WorkerRequest,
  type WorkerResponse,
} from './bookmark-worker.types';

describe('bookmark worker protocol', () => {
  const request: WorkerRequest = {
    protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
    requestId: 'parse-1',
    operation: 'parse-bookmark-html',
    type: 'request',
    payload: { html: '<DL><DT><A HREF="https://example.com">Example</A></DT></DL>' },
  };

  it('validates requests and emits bounded progress followed by a valid success envelope', () => {
    const responses: WorkerResponse[] = [];

    expect(isWorkerRequest(request)).toBe(true);
    handleBookmarkWorkerRequest(request, (response) => responses.push(response));

    expect(responses.map((response) => response.type)).toEqual(['progress', 'progress', 'success']);
    expect(responses.every(isWorkerResponse)).toBe(true);
    expect(responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
          requestId: request.requestId,
          operation: request.operation,
        }),
      ])
    );

    const progress = responses.filter((response) => response.type === 'progress');
    expect(progress.map((response) => response.progress.percent)).toEqual([0, 100]);
  });

  it('returns a structured user-safe error for a malformed parse request with an identity', () => {
    const responses: WorkerResponse[] = [];

    handleBookmarkWorkerRequest(
      {
        protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
        requestId: 'parse-2',
        operation: 'parse-bookmark-html',
        type: 'request',
        payload: { html: 42 },
      },
      (response) => responses.push(response)
    );

    expect(responses).toEqual([
      {
        protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
        requestId: 'parse-2',
        operation: 'parse-bookmark-html',
        type: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Trove could not start bookmark parsing.',
          retryable: false,
        },
      },
    ]);
  });

  it('rejects malformed, unbounded, and structurally invalid responses', () => {
    const validSnapshot: BookmarkWorkspaceSnapshot = {
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
    const envelope = {
      protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
      requestId: request.requestId,
      operation: request.operation,
    } as const;

    expect(
      isWorkerResponse({
        ...envelope,
        type: 'progress',
        progress: { phase: 'parsing', percent: 101 },
      })
    ).toBe(false);
    expect(isWorkerResponse({ ...envelope, type: 'success', payload: null })).toBe(false);
    expect(isWorkerResponse({ ...envelope, type: 'success', payload: validSnapshot })).toBe(true);
  });
});
