import BrowserVoiceEngine from "./browserVoiceEngine";
import createVoiceWorker from "./createVoiceWorker";

jest.mock("./createVoiceWorker", () => jest.fn());
let worker;
beforeEach(() => {
  worker = { postMessage: jest.fn(), terminate: jest.fn() };
  createVoiceWorker.mockReturnValue(worker);
});

test("loading forwards progress, resolves by request ID, and reuses loaded models", async () => {
  const engine = new BrowserVoiceEngine();
  const onProgress = jest.fn();
  const loading = engine.load({ onProgress });
  worker.onmessage({ data: { id: 1, type: "progress", data: { progress: 45 } } });
  expect(onProgress).toHaveBeenCalledWith({ progress: 45 });
  worker.onmessage({ data: { id: 1, type: "result", data: { device: "webgpu" } } });
  await expect(loading).resolves.toEqual({ device: "webgpu" });
  await expect(engine.load()).resolves.toEqual({ device: "webgpu" });
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
});

test("canceling inference discards late audio without closing the loaded worker", async () => {
  const engine = new BrowserVoiceEngine();
  const controller = new AbortController();
  const pending = engine.request("speak", { text: "Hello" }, { signal: controller.signal });
  const rejected = expect(pending).rejects.toHaveProperty("name", "AbortError");
  controller.abort();
  await rejected;
  expect(worker.postMessage).toHaveBeenLastCalledWith({ type: "cancel", id: 1 });
  worker.onmessage({ data: { id: 1, type: "result", data: { audio: new Float32Array(1) } } });
  expect(engine.pending.size).toBe(0);
  expect(worker.terminate).not.toHaveBeenCalled();
});

test("canceling a model download terminates the worker and rejects all pending work", async () => {
  const engine = new BrowserVoiceEngine();
  const controller = new AbortController();
  const loading = engine.load({ signal: controller.signal });
  const reference = engine.request("reference", { audio: new Float32Array(120000) });
  const checks = [expect(loading).rejects.toHaveProperty("name", "AbortError"), expect(reference).rejects.toHaveProperty("name", "AbortError")];
  controller.abort();
  await Promise.all(checks);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(engine.worker).toBeNull();
  expect(engine.pending.size).toBe(0);
});

test("worker errors release resources and give an actionable device message", async () => {
  const engine = new BrowserVoiceEngine();
  const request = engine.request("speak", { text: "Hello" });
  worker.onerror({ preventDefault: jest.fn() });
  await expect(request).rejects.toThrow(/free memory/);
  expect(engine.worker).toBeNull();
});
