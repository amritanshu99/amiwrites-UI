/** @jest-environment node */
import { fetchPocketAsset } from "./pocketVoiceAssets";

Object.assign(global, require("node:vm").runInThisContext("({ Headers, Response, ReadableStream, DOMException })"));
const url = "https://huggingface.co/spaces/KevinAHM/pocket-tts-web/resolve/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/onnx/english_2026-04/";
const originalFetch = global.fetch, originalCaches = global.caches;
let put;
beforeEach(() => {
  put = jest.fn();
  global.caches = { open: jest.fn(async () => ({ match: jest.fn(), put })) };
  global.fetch = jest.fn(async () => new Response("{}"));
});
afterEach(() => { global.fetch = originalFetch; global.caches = originalCaches; });

test("returns cached model metadata without a network request", async () => {
  global.caches.open.mockResolvedValue({ match: async () => new Response('{"sample_rate":24000}') });
  expect(await (await fetchPocketAsset(url + "bundle.json")).json()).toEqual({ sample_rate: 24000 });
  expect(global.fetch).not.toHaveBeenCalled();
});

test("rejects incomplete model bytes without caching the damaged file", async () => {
  await expect(fetchPocketAsset(url + "mimi_encoder_int8.onnx")).rejects.toThrow(/incomplete/);
  expect(put).not.toHaveBeenCalled();
});

test("storage access and quota failures do not prevent loading", async () => {
  global.caches.open.mockRejectedValueOnce(new Error("Storage disabled"));
  expect(await (await fetchPocketAsset(url + "bundle.json")).text()).toBe("{}");
  put.mockRejectedValueOnce(new Error("Quota exceeded"));
  expect(await (await fetchPocketAsset(url + "bundle.json")).text()).toBe("{}");
});
