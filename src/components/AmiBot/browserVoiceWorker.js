/* eslint-env worker */
/* global globalThis */
import { AutoProcessor, ChatterboxModel, Tensor, pipeline, env, InterruptableStoppingCriteria } from "@huggingface/transformers";
import { createResumableModelFetch } from "./browserVoiceDownload";

// No model requests occur until the visitor explicitly starts voice mode.
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let reportDownload;
env.fetch = createResumableModelFetch(env.fetch, {
  onRetry: () => reportDownload?.({ status: "stage", message: "The connection paused. Resuming your model download…" }),
});
let model, processor, transcriber, speaker, recognitionDevice;
let queue = Promise.resolve();
let running;
const canceled = new Set();

async function execute({ id, type, data }) {
  const progress = (value) => globalThis.postMessage({ id, type: "progress", data: value });
  if (type === "load") {
    reportDownload = progress;
    const adapter = await navigator.gpu?.requestAdapter().catch(() => null);
    const device = adapter ? "webgpu" : "wasm";
    // Keep the voice encoder/vocoder in higher precision; aggressive quantization
    // can lose words and voice detail. Only the autoregressive model uses 4-bit weights.
    const half = adapter?.features.has("shader-f16");
    const dtype = { embed_tokens: half ? "fp16" : "fp32", speech_encoder: half ? "fp16" : "q8",
      conditional_decoder: half ? "fp16" : "q8", language_model: half ? "q4f16" : "q4" };
    processor ||= await AutoProcessor.from_pretrained("ResembleAI/chatterbox-turbo-ONNX");
    model ||= await ChatterboxModel.from_pretrained("ResembleAI/chatterbox-turbo-ONNX", { device, dtype, progress_callback: progress });
    progress({ status: "stage", message: "Loading speech recognition…" });
    if (!transcriber) {
      recognitionDevice = device;
      const recognize = async (target) => {
        const recognizer = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", {
          device: target, dtype: target === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8", progress_callback: progress,
        });
        try {
          progress({ status: "stage", message: "Warming up speech recognition for faster replies…" });
          await recognizer(new Float32Array(16000), { max_new_tokens: 1 });
          return recognizer;
        } catch (error) { await recognizer.dispose(); throw error; }
      };
      try { transcriber = await recognize(device); }
      catch (error) {
        if (device === "wasm") throw error;
        progress({ status: "stage", message: "Using CPU speech recognition on this device…" });
        recognitionDevice = "wasm";
        transcriber = await recognize("wasm");
      }
    }
    return { device, recognitionDevice };
  }
  if (!model || !transcriber) throw new Error("Download the voice models first.");
  if (type === "reference") {
    if (data.audio.length < 120000 || data.audio.length > 720000) throw new Error("Use a 5–30 second reference recording.");
    for (const tensor of Object.values(speaker || {})) tensor.dispose?.();
    const audio = new Tensor("float32", data.audio, [1, data.audio.length]);
    try { speaker = await model.encode_speech(audio); } finally { audio.dispose(); }
    return { ready: true };
  }
  const criteria = new InterruptableStoppingCriteria();
  running = { id, criteria };
  if (type === "transcribe") {
    if (!data.audio.length || data.audio.length > 60 * 16000) throw new Error("Please keep voice turns under one minute.");
    const result = await transcriber(data.audio, { chunk_length_s: 20, stride_length_s: 3, stopping_criteria: [criteria] });
    return { text: result.text.trim(), language: "en" };
  }
  if (type === "speak") {
    if (!speaker) throw new Error("AmiBot’s voice reference is missing.");
    if (!data.text?.trim() || data.text.length > 220) throw new Error("Please use a shorter sentence.");
    const inputs = await processor(data.text);
    let waveform;
    try {
      waveform = await model.generate({ ...inputs, ...speaker,
        max_new_tokens: 512, stopping_criteria: [criteria] });
      const audio = new Float32Array(waveform.data);
      return { audio, sampleRate: 24000 };
    } finally {
      waveform?.dispose();
      for (const tensor of Object.values(inputs)) tensor.dispose?.();
    }
  }
  throw new Error("Unknown voice operation.");
}

globalThis.onmessage = ({ data: message }) => {
  if (message.type === "cancel") {
    canceled.add(message.id);
    if (running?.id === message.id) running.criteria.interrupt();
    return;
  }
  // Models and speaker tensors are shared; inference must never overlap.
  queue = queue.then(async () => {
    try {
      if (canceled.has(message.id)) return;
      const data = await execute(message);
      if (!canceled.has(message.id)) globalThis.postMessage({ id: message.id, type: "result", data }, data.audio ? [data.audio.buffer] : []);
    } catch (error) {
      globalThis.postMessage({ id: message.id, type: "error", message: error.message || "This device could not run the voice model." });
    } finally { canceled.delete(message.id); if (running?.id === message.id) running = null; if (message.type === "load") reportDownload = null; }
  });
};
