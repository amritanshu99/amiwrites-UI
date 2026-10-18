/* global globalThis */
import { createResumableModelFetch } from "./browserVoiceDownload";

const sizes = {
  "mimi_encoder_int8.onnx": 20779616, "text_conditioner_int8.onnx": 16388384,
  "flow_lm_main_int8.onnx": 76341079, "flow_lm_flow_int8.onnx": 9962530,
  "mimi_decoder_int8.onnx": 22684077,
};
const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
const loaded = new Map();

export async function fetchPocketAsset(url, progress) {
  const file = url.split("/").pop();
  const notify = (bytes) => {
    if (!sizes[file]) return;
    loaded.set(file, Math.min(bytes, sizes[file]));
    progress?.({ status: "progress_total", name: "pocket-tts", progress: 100 * [...loaded.values()].reduce((a, b) => a + b, 0) / total });
  };
  let cache;
  try {
    cache = await globalThis.caches?.open("amibot-pocket-voice-v1");
    const cached = await cache?.match(url);
    if (cached) { notify(sizes[file]); return cached; }
  } catch { /* Private browsing or storage restrictions: use memory only. */ }
  const fetchModel = createResumableModelFetch(globalThis.fetch.bind(globalThis), {
    onRetry: () => progress?.({ message: "Reconnecting to finish the voice model download..." }),
  });
  const response = await fetchModel(url);
  if (!response.ok) throw new Error(`Voice model download failed (${response.status}). Please try again.`);
  const reader = response.body?.getReader();
  let bytes;
  if (reader) {
    const chunks = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); length += value.length; notify(length);
    }
    bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  } else bytes = new Uint8Array(await response.arrayBuffer());
  if (sizes[file] && bytes.length !== sizes[file]) throw new Error("The voice model download was incomplete. Please try again.");
  const complete = new Response(bytes, { headers: response.headers });
  try { await cache?.put(url, complete.clone()); } catch { /* Cache quota must not prevent conversation. */ }
  notify(bytes.length);
  return complete;
}
