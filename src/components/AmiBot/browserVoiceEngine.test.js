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
  const rejected = pending.catch((error) => error);
  controller.abort();
  await expect(rejected).resolves.toHaveProperty("name", "AbortError");
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
  const checks = [loading, reference].map((pending) => pending.catch((error) => error));
  controller.abort();
  for (const check of checks) await expect(check).resolves.toHaveProperty("name", "AbortError");
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

test("streams audio before completion and drops late chunks after interruption", async () => {
  const engine = new BrowserVoiceEngine();
  const controller = new AbortController(), onAudio = jest.fn();
  const pending = engine.request("speak", { text: "Hello" }, { signal: controller.signal, onAudio });
  const rejected = pending.catch(error => error);
  const chunk = { audio: new Float32Array([0.1]), sampleRate: 24000 };
  worker.onmessage({ data: { id: 1, type: "audio", data: chunk } });
  expect(onAudio).toHaveBeenCalledWith(chunk);
  expect(engine.pending.size).toBe(1);
  controller.abort();
  worker.onmessage({ data: { id: 1, type: "audio", data: chunk } });
  expect(onAudio).toHaveBeenCalledTimes(1);
  await expect(rejected).resolves.toHaveProperty("name", "AbortError");
});

test("a playback failure cancels generation and rejects the turn", async () => {
  const engine = new BrowserVoiceEngine();
  const pending = engine.request("speak", { text: "Hello" }, { onAudio: () => { throw new Error("Audio device closed"); } });
  worker.onmessage({ data: { id: 1, type: "audio", data: {} } });
  await expect(pending).rejects.toThrow("Audio device closed");
  expect(worker.postMessage).toHaveBeenLastCalledWith({ type: "cancel", id: 1 });
  expect(engine.pending.size).toBe(0);
});

test("repeated speech uses a private copy of cached audio without another inference", async () => {
  const engine = new BrowserVoiceEngine();
  const first = engine.request("speak", { text: "Hello" });
  worker.onmessage({ data: { id: 1, type: "result", data: { audio: new Float32Array([0.1, 0.2]), sampleRate: 24000 } } });
  (await first).audio.fill(0);
  const second = await engine.request("speak", { text: "Hello" });
  expect(second.audio[0]).toBeCloseTo(0.1);
  second.audio.fill(0);
  expect((await engine.request("speak", { text: "Hello" })).audio[0]).toBeCloseTo(0.1);
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  controller.abort();
  await expect(engine.request("speak", { text: "Hello" }, { signal: controller.signal })).rejects.toHaveProperty("name", "AbortError");
  engine.dispose();
  expect(engine.cachedBytes).toBe(0);
});

test("changing the voice clears cached speech and excludes late results from the previous voice", async () => {
  const engine = new BrowserVoiceEngine();
  const old = engine.request("speak", { text: "Hello" });
  const reference = engine.request("reference", { audio: new Float32Array(120000) });
  worker.onmessage({ data: { id: 1, type: "result", data: { audio: new Float32Array(10), sampleRate: 24000 } } });
  worker.onmessage({ data: { id: 2, type: "result", data: { ready: true } } });
  await Promise.all([old, reference]);
  expect(engine.cachedBytes).toBe(0);
  const next = engine.request("speak", { text: "Hello" });
  worker.onmessage({ data: { id: 3, type: "result", data: { audio: new Float32Array(10), sampleRate: 24000 } } });
  await next;
  expect(worker.postMessage).toHaveBeenCalledTimes(3);
  expect(engine.cachedBytes).toBe(40);
});

test("speech cache is bounded and duplicate queued results do not inflate its byte count", async () => {
  const engine = new BrowserVoiceEngine();
  const requests = [engine.request("speak", { text: "Same" }), engine.request("speak", { text: "Same" })];
  for (let id = 1; id <= 2; id++) worker.onmessage({ data: { id, type: "result", data: { audio: new Float32Array(1024 * 1024), sampleRate: 24000 } } });
  await Promise.all(requests);
  expect(engine.cachedBytes).toBe(4 * 1024 * 1024);
  for (const text of ["Second", "Third"]) {
    const pending = engine.request("speak", { text });
    worker.onmessage({ data: { id: engine.sequence, type: "result", data: { audio: new Float32Array(1024 * 1024), sampleRate: 24000 } } });
    await pending;
  }
  expect(engine.cachedBytes).toBe(8 * 1024 * 1024);
  expect([...engine.speechCache.keys()]).toEqual(["Second", "Third"]);
});
