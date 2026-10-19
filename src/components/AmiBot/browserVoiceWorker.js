/* eslint-env worker */
/* global globalThis */
import { pipeline, env, InterruptableStoppingCriteria } from "@huggingface/transformers";
import { createResumableModelFetch } from "./browserVoiceDownload";
import pocketVoice from "./pocketVoiceModel";

// No model requests occur until the visitor explicitly starts voice mode.
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let reportDownload;
env.fetch = createResumableModelFetch(env.fetch, {
  onRetry: () => reportDownload?.({ status: "stage", message: "The connection paused. Resuming your model download…" }),
});
let transcriber, recognitionDevice, loaded = false, voiceReady = false;
let queue = Promise.resolve();
let running;
let warmed = false;
const canceled = new Set();

async function execute({ id, type, data }) {
  const progress = (value) => globalThis.postMessage({ id, type: "progress", data: value });
  if (type === "load") {
    reportDownload = progress;
    const voice = await pocketVoice.load(progress);
    if (data.recognition === "browser") {
      // Chrome handles input after explicit consent. Keep only cloned TTS in
      // memory on phones, with no unnecessary Whisper download or GPU session.
      if (transcriber) await transcriber.dispose();
      transcriber = null;
      recognitionDevice = "browser";
      loaded = true;
      return { ...voice, recognitionDevice };
    }
    const adapter = await navigator.gpu?.requestAdapter().catch(() => null);
    const device = adapter ? "webgpu" : "wasm";
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
    loaded = true;
    return { ...voice, recognitionDevice };
  }
  if (!loaded) throw new Error("Download the voice models first.");
  if (type === "reference") {
    if (data.audio.length < 120000 || data.audio.length > 720000) throw new Error("Use a 5–30 second reference recording.");
    await pocketVoice.setReference(data.audio);
    voiceReady = true;
    warmed = false;
    return { ready: true };
  }
  if (type === "warmup" && warmed) return { ready: true };
  const criteria = new InterruptableStoppingCriteria();
  running = { id, criteria };
  if (type === "transcribe") {
    if (!transcriber) throw new Error("Choose on-device recognition and start again.");
    if (!data.audio.length || data.audio.length > 60 * 16000) throw new Error("Please keep voice turns under one minute.");
    const result = await transcriber(data.audio, { chunk_length_s: 30, stride_length_s: 5, stopping_criteria: [criteria] });
    return { text: result.text.trim(), language: "en" };
  }
  if (type === "speak" || type === "warmup") {
    if (!voiceReady) throw new Error("AmiBot's voice reference is missing.");
    const text = type === "warmup" ? "Hello! How can I help you today?" : data.text;
    if (!text?.trim() || text.length > 500) throw new Error("Please use a shorter sentence.");
    const audio = await pocketVoice.generate(text, {
      canceled: () => canceled.has(id),
      onChunk: type === "warmup" ? undefined : (chunk) => {
        if (!canceled.has(id)) globalThis.postMessage({ id, type: "audio", data: { audio: chunk, sampleRate: 24000 } }, [chunk.buffer]);
      },
    });
    if (!canceled.has(id)) warmed = true;
    return type === "warmup" ? { ready: true } : { audio, sampleRate: 24000 };
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
