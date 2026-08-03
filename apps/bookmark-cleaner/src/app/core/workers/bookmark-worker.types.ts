import type {
  BookmarkAnalysis,
  BookmarkFolder,
  BookmarkLink,
  BookmarkWorkspaceSnapshot,
  CountSummary,
  ParseWarning,
} from '../models/bookmark.models';

export const BOOKMARK_WORKER_PROTOCOL_VERSION = 1 as const;

export type BookmarkWorkerOperation = 'parse-bookmark-html';
export type BookmarkWorkerProgressPhase = 'parsing';
export type BookmarkWorkerErrorCode = 'INVALID_REQUEST' | 'PARSE_FAILED';

interface WorkerEnvelope {
  protocolVersion: typeof BOOKMARK_WORKER_PROTOCOL_VERSION;
  requestId: string;
  operation: BookmarkWorkerOperation;
}

export interface ParseBookmarkHtmlRequest extends WorkerEnvelope {
  type: 'request';
  operation: 'parse-bookmark-html';
  payload: {
    html: string;
  };
}

export type WorkerRequest = ParseBookmarkHtmlRequest;

export interface WorkerProgress {
  phase: BookmarkWorkerProgressPhase;
  percent: number;
}

export interface ParseProgressResponse extends WorkerEnvelope {
  type: 'progress';
  operation: 'parse-bookmark-html';
  progress: WorkerProgress;
}

export interface ParseSuccessResponse extends WorkerEnvelope {
  type: 'success';
  operation: 'parse-bookmark-html';
  payload: BookmarkWorkspaceSnapshot;
}

export interface WorkerErrorResponse extends WorkerEnvelope {
  type: 'error';
  error: {
    code: BookmarkWorkerErrorCode;
    message: string;
    retryable: boolean;
  };
}

export type WorkerResponse = ParseProgressResponse | ParseSuccessResponse | WorkerErrorResponse;

const MAX_REQUEST_ID_LENGTH = 128;
const MAX_VALIDATED_NODES = 1_000_000;

export function isWorkerRequest(value: unknown): value is WorkerRequest {
  if (!hasValidEnvelope(value) || value['type'] !== 'request') {
    return false;
  }

  return isRecord(value['payload']) && typeof value['payload']['html'] === 'string';
}

export function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!hasValidEnvelope(value)) {
    return false;
  }

  switch (value['type']) {
    case 'progress':
      return isWorkerProgress(value['progress']);
    case 'success':
      return isBookmarkWorkspaceSnapshot(value['payload']);
    case 'error':
      return isWorkerError(value['error']);
    default:
      return false;
  }
}

export function getWorkerMessageRequestId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return isRequestId(value['requestId']) ? value['requestId'] : null;
}

export function hasParseRequestIdentity(
  value: unknown
): value is { requestId: string; operation: 'parse-bookmark-html' } {
  return (
    isRecord(value) &&
    isRequestId(value['requestId']) &&
    value['operation'] === 'parse-bookmark-html'
  );
}

function hasValidEnvelope(value: unknown): value is Record<string, unknown> & {
  protocolVersion: typeof BOOKMARK_WORKER_PROTOCOL_VERSION;
  requestId: string;
  operation: 'parse-bookmark-html';
} {
  return (
    isRecord(value) &&
    value['protocolVersion'] === BOOKMARK_WORKER_PROTOCOL_VERSION &&
    isRequestId(value['requestId']) &&
    value['operation'] === 'parse-bookmark-html'
  );
}

function isWorkerProgress(value: unknown): value is WorkerProgress {
  return (
    isRecord(value) &&
    value['phase'] === 'parsing' &&
    typeof value['percent'] === 'number' &&
    Number.isFinite(value['percent']) &&
    value['percent'] >= 0 &&
    value['percent'] <= 100
  );
}

function isWorkerError(value: unknown): value is WorkerErrorResponse['error'] {
  return (
    isRecord(value) &&
    (value['code'] === 'INVALID_REQUEST' || value['code'] === 'PARSE_FAILED') &&
    typeof value['message'] === 'string' &&
    typeof value['retryable'] === 'boolean'
  );
}

function isBookmarkWorkspaceSnapshot(value: unknown): value is BookmarkWorkspaceSnapshot {
  return (
    isRecord(value) &&
    isBookmarkTree(value['originalTree']) &&
    isArrayOf(value['bookmarks'], isBookmarkLink) &&
    isBookmarkAnalysis(value['analysis']) &&
    isArrayOf(value['warnings'], isParseWarning)
  );
}

function isBookmarkTree(value: unknown): value is BookmarkFolder {
  if (!isBookmarkFolder(value)) {
    return false;
  }

  const pending: unknown[] = [value];
  const visited = new WeakSet<object>();
  let validatedNodes = 0;

  while (pending.length > 0) {
    const node = pending.pop();
    if (!isRecord(node) || visited.has(node)) {
      return false;
    }

    visited.add(node);
    validatedNodes += 1;
    if (validatedNodes > MAX_VALIDATED_NODES) {
      return false;
    }

    if (node['type'] === 'folder') {
      if (!isBookmarkFolder(node)) {
        return false;
      }

      for (const child of node['children']) {
        pending.push(child);
      }
    } else if (!isBookmarkLink(node)) {
      return false;
    }
  }

  return true;
}

function isBookmarkFolder(value: unknown): value is BookmarkFolder {
  return (
    isRecord(value) &&
    value['type'] === 'folder' &&
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    isStringArray(value['path']) &&
    Array.isArray(value['children']) &&
    value['children'].length <= MAX_VALIDATED_NODES
  );
}

function isBookmarkLink(value: unknown): value is BookmarkLink {
  return (
    isRecord(value) &&
    value['type'] === 'link' &&
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['url'] === 'string' &&
    typeof value['normalizedUrl'] === 'string' &&
    typeof value['domain'] === 'string' &&
    typeof value['host'] === 'string' &&
    typeof value['registrableDomain'] === 'string' &&
    typeof value['scheme'] === 'string' &&
    isStringArray(value['path']) &&
    isStringArray(value['tags'])
  );
}

function isBookmarkAnalysis(value: unknown): value is BookmarkAnalysis {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value['totalBookmarks']) &&
    isNonNegativeInteger(value['totalFolders']) &&
    isNonNegativeInteger(value['uniqueUrls']) &&
    isNonNegativeInteger(value['malformedEntries']) &&
    isNonNegativeInteger(value['warningCount']) &&
    isNonNegativeInteger(value['bookmarkletCount']) &&
    isArrayOf(value['schemeBreakdown'], isCountSummary) &&
    isArrayOf(value['topHosts'], isCountSummary) &&
    isArrayOf(value['topRegistrableDomains'], isCountSummary)
  );
}

function isCountSummary(value: unknown): value is CountSummary {
  return (
    isRecord(value) && typeof value['key'] === 'string' && isNonNegativeInteger(value['count'])
  );
}

function isParseWarning(value: unknown): value is ParseWarning {
  return (
    isRecord(value) &&
    (value['code'] === 'MISSING_URL' ||
      value['code'] === 'MISSING_TITLE' ||
      value['code'] === 'MALFORMED_ENTRY') &&
    typeof value['message'] === 'string'
  );
}

function isRequestId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_REQUEST_ID_LENGTH;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.length <= MAX_VALIDATED_NODES && value.every(guard);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
