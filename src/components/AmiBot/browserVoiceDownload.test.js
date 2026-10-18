/** @jest-environment node */
import { createResumableModelFetch } from "./browserVoiceDownload";

// CRA's older Jest environment omits Node 24's Fetch/Streams globals. Use the
// native implementations so these tests exercise real stream cancellation.
Object.assign(global, require("node:vm").runInThisContext("({ Headers, Response, ReadableStream, DOMException })"));

const url = "https://huggingface.co/onnx-community/chatterbox-ONNX/resolve/main/onnx/speech_encoder.onnx_data";
const bytes = (...values) => new Uint8Array(values);
const reply = (chunks, { status = 200, size = 4, etag = '"model-v1"', range, stall = false } = {}) => new Response(new ReadableStream({
  start(controller) {
    chunks.forEach(chunk => controller.enqueue(chunk));
    if (!stall) controller.close();
  },
}), { status, headers: { "content-length": String(size), ...(etag ? { etag } : {}), ...(range ? { "content-range": range } : {}) } });
const resumed = (options = {}) => reply([bytes(3, 4)], { status: 206, size: 2, range: "bytes 2-3/4", ...options });
const values = async response => Array.from(new Uint8Array(await response.arrayBuffer()));

test("leaves metadata and other requests unchanged", async () => {
  const original = new Response("{}");
  const fetch = jest.fn().mockResolvedValue(original);
  const download = createResumableModelFetch(fetch);
  const options = { headers: { Accept: "application/json" } };
  await expect(download(url.replace("onnx/speech_encoder.onnx_data", "config.json"), options)).resolves.toBe(original);
  expect(fetch).toHaveBeenCalledWith(url.replace("onnx/speech_encoder.onnx_data", "config.json"), options);
});

test("resumes stalled body from delivered offset and preserves full response size", async () => {
  const fetch = jest.fn().mockResolvedValueOnce(reply([bytes(1, 2)], { stall: true })).mockResolvedValueOnce(resumed());
  const onRetry = jest.fn();
  const response = await createResumableModelFetch(fetch, { stallTimeoutMs: 25, onRetry })(url);
  expect(response.headers.get("content-length")).toBe("4");
  await expect(values(response)).resolves.toEqual([1, 2, 3, 4]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[1][0]).toBe(url);
  expect(fetch.mock.calls[1][1].headers.get("range")).toBe("bytes=2-");
  expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1, loaded: 2, total: 4 }));
});

test("recovers a truncated response without duplicating bytes", async () => {
  const fetch = jest.fn().mockResolvedValueOnce(reply([bytes(1, 2)])).mockResolvedValueOnce(resumed());
  await expect(values(await createResumableModelFetch(fetch)(url))).resolves.toEqual([1, 2, 3, 4]);
});

test("resumes pinned Pocket model downloads inside the language directory", async () => {
  const pocketUrl = `https://huggingface.co/spaces/KevinAHM/pocket-tts-web/resolve/${"a".repeat(40)}/onnx/english_2026-04/flow_lm_main_int8.onnx`;
  const fetch = jest.fn().mockResolvedValueOnce(reply([bytes(1, 2)], { etag: null })).mockResolvedValueOnce(resumed({ etag: null }));
  await expect(values(await createResumableModelFetch(fetch)(pocketUrl))).resolves.toEqual([1, 2, 3, 4]);
  expect(fetch.mock.calls[1][1].headers.get("range")).toBe("bytes=2-");
});

test.each([
  ["ignored range", { status: 200 }],
  ["wrong start", { range: "bytes 1-2/4" }],
  ["changed total", { range: "bytes 2-3/5" }],
  ["changed ETag", { etag: '"model-v2"' }],
  ["missing ETag", { etag: null }],
])("rejects unsafe resume: %s", async (_, options) => {
  const fetch = jest.fn().mockResolvedValueOnce(reply([bytes(1, 2)])).mockResolvedValueOnce(resumed(options));
  await expect(values(await createResumableModelFetch(fetch)(url))).rejects.toThrow(/safely resume/);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("requires stable file identity, allowing a pinned revision without an ETag", async () => {
  const makeFetch = () => jest.fn().mockResolvedValueOnce(reply([bytes(1, 2)], { etag: null })).mockResolvedValueOnce(resumed({ etag: null }));
  await expect(values(await createResumableModelFetch(makeFetch())(url))).rejects.toThrow(/safely resume/);
  const pinnedUrl = url.replace("/main/", `/${"a".repeat(40)}/`);
  await expect(values(await createResumableModelFetch(makeFetch())(pinnedUrl))).resolves.toEqual([1, 2, 3, 4]);
});

test("bounds repeated body stalls to two retries", async () => {
  const fetch = jest.fn().mockImplementation(() => Promise.resolve(reply([], { stall: true })));
  const response = await createResumableModelFetch(fetch, { stallTimeoutMs: 15 })(url);
  await expect(values(response)).rejects.toThrow(/interrupted repeatedly/);
  expect(fetch).toHaveBeenCalledTimes(3);
});

test("retries header stalls and bounds them to two retries", async () => {
  const fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
  await expect(createResumableModelFetch(fetch, { stallTimeoutMs: 15 })(url)).rejects.toThrow(/interrupted repeatedly/);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls.every(([, options]) => options.signal.aborted)).toBe(true);
});

test("aborting a body cancels the underlying request without retry", async () => {
  const fetch = jest.fn().mockResolvedValue(reply([bytes(1, 2)], { stall: true }));
  const controller = new AbortController();
  const response = await createResumableModelFetch(fetch)(url, { signal: controller.signal });
  const reader = response.body.getReader();
  await expect(reader.read()).resolves.toEqual({ value: bytes(1, 2), done: false });
  const read = reader.read();
  controller.abort();
  await expect(read).rejects.toHaveProperty("name", "AbortError");
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("aborting before headers rejects immediately without retry", async () => {
  const fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
  const controller = new AbortController();
  const loading = createResumableModelFetch(fetch)(url, { signal: controller.signal });
  controller.abort();
  await expect(loading).rejects.toHaveProperty("name", "AbortError");
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("canceling the returned stream aborts the source request", async () => {
  const fetch = jest.fn().mockResolvedValue(reply([], { stall: true }));
  const response = await createResumableModelFetch(fetch)(url);
  await response.body.cancel();
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
});
