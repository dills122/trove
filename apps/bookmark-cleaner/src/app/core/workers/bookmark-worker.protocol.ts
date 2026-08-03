import { parseBookmarkHtml } from '../parsing/bookmark-parser';
import {
  BOOKMARK_WORKER_PROTOCOL_VERSION,
  hasParseRequestIdentity,
  isWorkerRequest,
  type WorkerRequest,
  type WorkerResponse,
} from './bookmark-worker.types';

export type BookmarkWorkerResponder = (response: WorkerResponse) => void;

export function handleBookmarkWorkerRequest(data: unknown, respond: BookmarkWorkerResponder): void {
  if (!isWorkerRequest(data)) {
    respondToInvalidParseRequest(data, respond);
    return;
  }

  handleParseRequest(data, respond);
}

function handleParseRequest(request: WorkerRequest, respond: BookmarkWorkerResponder): void {
  const envelope = {
    protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
    requestId: request.requestId,
    operation: request.operation,
  } as const;

  respond({
    ...envelope,
    type: 'progress',
    progress: { phase: 'parsing', percent: 0 },
  });

  try {
    const payload = parseBookmarkHtml(request.payload.html);
    respond({
      ...envelope,
      type: 'progress',
      progress: { phase: 'parsing', percent: 100 },
    });
    respond({ ...envelope, type: 'success', payload });
  } catch {
    respond({
      ...envelope,
      type: 'error',
      error: {
        code: 'PARSE_FAILED',
        message: 'Trove could not parse this bookmark file.',
        retryable: false,
      },
    });
  }
}

function respondToInvalidParseRequest(data: unknown, respond: BookmarkWorkerResponder): void {
  if (!hasParseRequestIdentity(data)) {
    return;
  }

  respond({
    protocolVersion: BOOKMARK_WORKER_PROTOCOL_VERSION,
    requestId: data.requestId,
    operation: data.operation,
    type: 'error',
    error: {
      code: 'INVALID_REQUEST',
      message: 'Trove could not start bookmark parsing.',
      retryable: false,
    },
  });
}
