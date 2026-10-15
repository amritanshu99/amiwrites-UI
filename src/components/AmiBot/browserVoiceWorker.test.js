/** @jest-environment node */
jest.mock("@huggingface/transformers", () => ({
  AutoProcessor: { from_pretrained: jest.fn() },
  ChatterboxModel: { from_pretrained: jest.fn() },
  Tensor: jest.fn(),
  pipeline: jest.fn(),
  InterruptableStoppingCriteria: jest.fn(),
  env: { fetch: jest.fn(), backends: { onnx: { wasm: {} } } },
}));

let library, recognizer, send, originalNavigator, originalPost, originalMessage;
beforeEach(() => {
  jest.resetModules();
  library = require("@huggingface/transformers");
  library.AutoProcessor.from_pretrained.mockResolvedValue({});
  library.ChatterboxModel.from_pretrained.mockResolvedValue({});
  recognizer = Object.assign(jest.fn(async () => ({ text: "" })), { dispose: jest.fn(async () => {}) });
  library.pipeline.mockResolvedValue(recognizer);
  originalNavigator = Object.getOwnPropertyDescriptor(global, "navigator");
  originalPost = global.postMessage;
  originalMessage = global.onmessage;
  Object.defineProperty(global, "navigator", { configurable: true, value: { gpu: { requestAdapter: jest.fn(async () => ({ features: new Set(["shader-f16"]) })) } } });
  let sequence = 0;
  send = (type) => new Promise((resolve) => {
    const id = ++sequence;
    global.postMessage = jest.fn((message) => { if (message.id === id && message.type !== "progress") resolve(message); });
    global.onmessage({ data: { id, type, data: {} } });
  });
  require("./browserVoiceWorker");
});
afterEach(() => {
  if (originalNavigator) Object.defineProperty(global, "navigator", originalNavigator);
  else delete global.navigator;
  global.postMessage = originalPost;
  global.onmessage = originalMessage;
});

test("uses Turbo, GPU recognition and one-time warm-up while preserving voice precision", async () => {
  expect((await send("load")).data).toEqual({ device: "webgpu", recognitionDevice: "webgpu" });
  expect(library.ChatterboxModel.from_pretrained).toHaveBeenCalledWith("ResembleAI/chatterbox-turbo-ONNX", expect.objectContaining({
    device: "webgpu", dtype: { embed_tokens: "fp16", speech_encoder: "fp16", conditional_decoder: "fp16", language_model: "q4f16" },
  }));
  expect(library.pipeline).toHaveBeenCalledWith("automatic-speech-recognition", "onnx-community/whisper-base.en", expect.objectContaining({ device: "webgpu" }));
  expect(recognizer).toHaveBeenCalledWith(expect.any(Float32Array), { max_new_tokens: 1 });
  await send("load");
  expect(library.pipeline).toHaveBeenCalledTimes(1);
  expect(recognizer).toHaveBeenCalledTimes(1);
});

test("falls back to CPU recognition if GPU warm-up fails and releases the failed session", async () => {
  const broken = Object.assign(jest.fn(async () => { throw new Error("GPU operator unsupported"); }), { dispose: jest.fn(async () => {}) });
  library.pipeline.mockResolvedValueOnce(broken).mockResolvedValueOnce(recognizer);
  expect((await send("load")).data).toEqual({ device: "webgpu", recognitionDevice: "wasm" });
  expect(broken.dispose).toHaveBeenCalledTimes(1);
  expect(library.pipeline).toHaveBeenLastCalledWith("automatic-speech-recognition", "onnx-community/whisper-base.en", expect.objectContaining({ device: "wasm", dtype: "q8" }));
});

test("devices without WebGPU load the CPU-compatible models", async () => {
  navigator.gpu.requestAdapter.mockResolvedValue(null);
  expect((await send("load")).data).toEqual({ device: "wasm", recognitionDevice: "wasm" });
  expect(library.ChatterboxModel.from_pretrained).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    device: "wasm", dtype: { embed_tokens: "fp32", speech_encoder: "q8", conditional_decoder: "q8", language_model: "q4" },
  }));
});

test("a failed CPU warm-up is reported instead of pretending setup succeeded", async () => {
  navigator.gpu.requestAdapter.mockResolvedValue(null);
  recognizer.mockRejectedValueOnce(new Error("Not enough memory"));
  expect(await send("load")).toMatchObject({ type: "error", message: "Not enough memory" });
  expect(recognizer.dispose).toHaveBeenCalledTimes(1);
});
