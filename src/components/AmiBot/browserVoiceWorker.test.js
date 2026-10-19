/** @jest-environment node */
jest.mock("@huggingface/transformers", () => ({
  pipeline: jest.fn(),
  InterruptableStoppingCriteria: jest.fn(),
  env: { fetch: jest.fn(), backends: { onnx: { wasm: {} } } },
}));

jest.mock("./pocketVoiceModel", () => ({ load: jest.fn(), setReference: jest.fn(), generate: jest.fn() }));

let pocket, library, recognizer, send, originalNavigator, originalPost, originalMessage;
beforeEach(() => {
  jest.resetModules();
  library = require("@huggingface/transformers");
  pocket = require("./pocketVoiceModel");
  pocket.load.mockResolvedValue({ device: "wasm-threads" });
  pocket.setReference.mockResolvedValue();
  pocket.generate.mockResolvedValue(new Float32Array(24000));
  recognizer = Object.assign(jest.fn(async () => ({ text: "" })), { dispose: jest.fn(async () => {}) });
  library.pipeline.mockResolvedValue(recognizer);
  originalNavigator = Object.getOwnPropertyDescriptor(global, "navigator");
  originalPost = global.postMessage;
  originalMessage = global.onmessage;
  Object.defineProperty(global, "navigator", { configurable: true, value: { gpu: { requestAdapter: jest.fn(async () => ({ features: new Set(["shader-f16"]) })) } } });
  let sequence = 0;
  send = (type, data = {}) => new Promise((resolve) => {
    const id = ++sequence;
    global.postMessage = jest.fn((message) => { if (message.id === id && (message.type === "result" || message.type === "error")) resolve(message); });
    global.onmessage({ data: { id, type, data } });
  });
  require("./browserVoiceWorker");
});
afterEach(() => {
  if (originalNavigator) Object.defineProperty(global, "navigator", originalNavigator);
  else delete global.navigator;
  global.postMessage = originalPost;
  global.onmessage = originalMessage;
});

test("uses Pocket cloned speech with GPU recognition and one-time recognition warm-up", async () => {
  expect((await send("load")).data).toEqual({ device: "wasm-threads", recognitionDevice: "webgpu" });
  expect(pocket.load).toHaveBeenCalledWith(expect.any(Function));
  expect(library.pipeline).toHaveBeenCalledWith("automatic-speech-recognition", "onnx-community/whisper-base.en", expect.objectContaining({ device: "webgpu" }));
  expect(recognizer).toHaveBeenCalledWith(expect.any(Float32Array), { max_new_tokens: 1 });
  await send("load");
  expect(library.pipeline).toHaveBeenCalledTimes(1);
  expect(recognizer).toHaveBeenCalledTimes(1);
});

test("falls back to CPU recognition if GPU warm-up fails and releases the failed session", async () => {
  const broken = Object.assign(jest.fn(async () => { throw new Error("GPU operator unsupported"); }), { dispose: jest.fn(async () => {}) });
  library.pipeline.mockResolvedValueOnce(broken).mockResolvedValueOnce(recognizer);
  expect((await send("load")).data).toEqual({ device: "wasm-threads", recognitionDevice: "wasm" });
  expect(broken.dispose).toHaveBeenCalledTimes(1);
  expect(library.pipeline).toHaveBeenLastCalledWith("automatic-speech-recognition", "onnx-community/whisper-base.en", expect.objectContaining({ device: "wasm", dtype: "q8" }));
});

test("devices without WebGPU load the CPU-compatible models", async () => {
  navigator.gpu.requestAdapter.mockResolvedValue(null);
  expect((await send("load")).data).toEqual({ device: "wasm-threads", recognitionDevice: "wasm" });
  expect(library.pipeline).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ device: "wasm" }));
});

test("browser recognition skips Whisper downloads but still prepares and speaks the cloned voice", async () => {
  expect((await send("load", { recognition: "browser" })).data).toEqual({ device: "wasm-threads", recognitionDevice: "browser" });
  expect(library.pipeline).not.toHaveBeenCalled();
  await send("reference", { audio: new Float32Array(120000) });
  await send("warmup");
  expect((await send("speak", { text: "My cloned voice." })).type).toBe("result");
  expect(pocket.generate).toHaveBeenCalledTimes(2);
  expect((await send("transcribe", { audio: new Float32Array(16000) })).type).toBe("error");
});

test("switching recognition modes releases local sessions and can load them again", async () => {
  await send("load");
  await send("load", { recognition: "browser" });
  expect(recognizer.dispose).toHaveBeenCalledTimes(1);
  await send("load", { recognition: "local" });
  expect(library.pipeline).toHaveBeenCalledTimes(2);
});

test("a failed CPU warm-up is reported instead of pretending setup succeeded", async () => {
  navigator.gpu.requestAdapter.mockResolvedValue(null);
  recognizer.mockRejectedValueOnce(new Error("Not enough memory"));
  expect(await send("load")).toMatchObject({ type: "error", message: "Not enough memory" });
  expect(recognizer.dispose).toHaveBeenCalledTimes(1);
});


test("speech warm-up runs once and never returns audible output", async () => {
  await send("load");
  await send("reference", { audio: new Float32Array(120000) });
  expect((await send("warmup")).data).toEqual({ ready: true });
  expect((await send("warmup")).data).toEqual({ ready: true });
  expect(pocket.generate).toHaveBeenCalledTimes(1);
  expect(pocket.generate.mock.calls[0][1].onChunk).toBeUndefined();
});

test("cloned PCM streams with its request ID and still returns the full reply for caching", async () => {
  await send("load");
  await send("reference", { audio: new Float32Array(120000) });
  const audio = new Float32Array(24000);
  pocket.generate.mockImplementation(async (text, { onChunk }) => { onChunk(audio.slice()); return audio; });
  const result = await send("speak", { text: "Hello from AmiBot." });
  expect(result.data.audio).toBe(audio);
  expect(global.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: result.id, type: "audio", data: { audio, sampleRate: 24000 } }), expect.any(Array));
});

test("invalid references and oversized speech never reach the voice model", async () => {
  await send("load");
  expect((await send("reference", { audio: new Float32Array(1) })).type).toBe("error");
  expect(pocket.setReference).not.toHaveBeenCalled();
  await send("reference", { audio: new Float32Array(120000) });
  expect((await send("speak", { text: "a".repeat(501) })).type).toBe("error");
  expect(pocket.generate).not.toHaveBeenCalled();
});
