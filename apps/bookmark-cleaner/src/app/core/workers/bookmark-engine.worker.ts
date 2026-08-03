/// <reference lib="webworker" />

import { handleBookmarkWorkerRequest } from './bookmark-worker.protocol';

addEventListener('message', ({ data }: MessageEvent<unknown>) => {
  handleBookmarkWorkerRequest(data, (response) => postMessage(response));
});
