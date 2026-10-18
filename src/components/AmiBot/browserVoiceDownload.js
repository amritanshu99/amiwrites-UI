const abortError = (signal) => signal?.reason || new DOMException("Voice download canceled", "AbortError");
const terminal = (message) => Object.assign(new Error(message), { doNotRetry: true });

// Transformers caches complete files. Keep its streaming/cache behavior, but recover
// interrupted large weight files without downloading their completed bytes again.
export function createResumableModelFetch(fetchImpl, {
  stallTimeoutMs = 45000, maxRetries = 2, onRetry,
} = {}) {
  return async (input, init = {}) => {
    let url;
    try { url = new URL(input); } catch { return fetchImpl(input, init); }
    const headers = new Headers(init.headers);
    const isWeight = ["huggingface.co", "hf.co"].includes(url.hostname)
      && /\/resolve\/[^/]+\/onnx\/(?:[^/]+\/)*[^/]+\.onnx(?:_data(?:_\d+)?)?$/.test(url.pathname);
    if (!isWeight || (init.method && init.method.toUpperCase() !== "GET") || headers.has("Range")) {
      return fetchImpl(input, init);
    }
    const signal = init.signal;
    if (signal?.aborted) throw abortError(signal);
    const pinned = /\/resolve\/[a-f0-9]{40}\//i.test(url.pathname);
    let attemptController, reader, streamController;
    let offset = 0, total = null, expectedEnd = null, etag = null, retries = 0, finished = false;

    const abandonAttempt = () => {
      attemptController?.abort();
      reader?.cancel().catch(() => {});
      reader = null;
    };
    const cleanup = () => signal?.removeEventListener("abort", cancel);
    const cancel = () => {
      if (finished) return;
      finished = true;
      abandonAttempt();
      streamController?.error(abortError(signal));
      cleanup();
    };
    signal?.addEventListener("abort", cancel, { once: true });

    // fetch() resolves at headers: the same deadline must also guard each body read.
    const waitFor = (operation) => new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        fn(value);
      };
      const onAbort = () => finish(reject, abortError(signal));
      const timer = setTimeout(() => {
        finish(reject, new Error("The voice model download stopped receiving data."));
        attemptController?.abort();
      }, stallTimeoutMs);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) { onAbort(); return; }
      Promise.resolve().then(operation).then(
        value => finish(resolve, value), error => finish(reject, error),
      );
    });

    const retry = (error) => {
      abandonAttempt();
      if (signal?.aborted || finished) throw abortError(signal);
      if (error.doNotRetry) throw error;
      if (retries >= maxRetries) {
        throw new Error("The voice model download was interrupted repeatedly. Check your connection and start voice mode again. Completed files are saved.");
      }
      retries += 1;
      onRetry?.({ file: url.pathname.split("/").pop(), attempt: retries, maxRetries, loaded: offset, total });
    };

    const open = async () => {
      while (true) {
        try {
          attemptController = new AbortController();
          const attemptSignal = attemptController.signal;
          const nextHeaders = new Headers(headers);
          if (offset) nextHeaders.set("Range", `bytes=${offset}-`);
          // Use the original Hub URL so an expired signed CDN URL can be refreshed.
          const response = await waitFor(() => fetchImpl(input, { ...init, headers: nextHeaders, signal: attemptSignal }));
          if ([408, 429, 500, 502, 503, 504].includes(response.status)) {
            response.body?.cancel().catch(() => {});
            throw new Error("The model server is temporarily unavailable.");
          }
          if (offset) {
            const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") || "");
            const start = Number(range?.[1]), end = Number(range?.[2]), size = Number(range?.[3]);
            const nextEtag = response.headers.get("etag");
            const length = response.headers.get("content-length");
            if (response.status !== 206 || !range || !Number.isSafeInteger(size) || start !== offset
                || end < start || end >= size || (total !== null && size !== total)
                || (length !== null && Number(length) !== end - start + 1)
                || (!pinned && !etag) || (etag && nextEtag !== etag)) {
              response.body?.cancel().catch(() => {});
              throw terminal("The model server could not safely resume this file. Start voice mode again.");
            }
            total = size;
            expectedEnd = end + 1;
          } else if (response.status === 200) {
            const size = Number(response.headers.get("content-length"));
            total = Number.isSafeInteger(size) && size > 0 ? size : null;
            expectedEnd = total;
            const tag = response.headers.get("etag");
            etag = tag && !tag.startsWith("W/") ? tag : null;
          }
          return response;
        } catch (error) { retry(error); }
      }
    };

    try {
      const response = await open();
      if (signal?.aborted) throw abortError(signal);
      if (response.status !== 200 || !response.body) { cleanup(); return response; }
      reader = response.body.getReader();
      const stream = new ReadableStream({
        start(controller) { streamController = controller; },
        async pull(controller) {
          while (!finished) {
            try {
              const activeReader = reader;
              const { value, done } = await waitFor(() => activeReader.read());
              if (finished) return;
              if (done) {
                if (total !== null && offset < total) throw new Error("The model download ended early.");
                finished = true;
                cleanup();
                controller.close();
                return;
              }
              if (!value?.byteLength) continue;
              if ((total !== null && offset + value.byteLength > total)
                  || (expectedEnd !== null && offset + value.byteLength > expectedEnd)) {
                throw terminal("The model server returned an invalid file length. Start voice mode again.");
              }
              offset += value.byteLength;
              controller.enqueue(value);
              return;
            } catch (error) {
              if (finished) return;
              try {
                retry(error);
                const resumed = await open();
                if (!resumed.body || (offset === 0 && resumed.status !== 200)) {
                  throw terminal("The model server could not restart the interrupted download.");
                }
                reader = resumed.body.getReader();
              } catch (failure) {
                finished = true;
                abandonAttempt();
                cleanup();
                controller.error(failure);
                return;
              }
            }
          }
        },
        cancel() { finished = true; abandonAttempt(); cleanup(); },
      });
      return new Response(stream, { status: response.status, statusText: response.statusText, headers: response.headers });
    } catch (error) {
      finished = true;
      abandonAttempt();
      cleanup();
      throw error;
    }
  };
}
