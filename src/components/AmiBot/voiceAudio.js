export function getRecordingOptions() {
  const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
    .find((type) => window.MediaRecorder?.isTypeSupported?.(type));
  return mimeType ? { mimeType, audioBitsPerSecond: 64000 } : {};
}

export function recordingName(type = "") {
  return `recording.${type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"}`;
}

export function speechChunks(markdown, maxCharacters = 400, firstChunkCharacters = maxCharacters) {
  const limit = Number.isFinite(maxCharacters) ? Math.max(1, Math.floor(maxCharacters)) : 400;
  const firstLimit = Number.isFinite(firstChunkCharacters) ? Math.max(1, Math.min(limit, Math.floor(firstChunkCharacters))) : limit;
  const text = markdown
    .replace(/```[\s\S]*?```/g, " See the code in the chat. ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\s+/g, " ").trim();
  const sentences = text.match(/.+?(?:[.!?।]+(?=\s|$)|$)/g) || [];
  const chunks = [];
  let chunk = "";
  const chunkLimit = () => chunks.length ? limit : firstLimit;
  const flush = () => { if (chunk) chunks.push(chunk); chunk = ""; };
  for (const sentence of sentences) {
    // Prefer a sentence boundary when the next complete sentence will not fit.
    if (chunk && sentence.trim().length <= chunkLimit() && chunk.length + sentence.trim().length + 1 > chunkLimit()) flush();
    for (const word of sentence.trim().split(/\s+/)) {
      let remaining = word;
      while (remaining) {
        const space = chunk ? " " : "";
        if (chunk.length + space.length + remaining.length <= chunkLimit()) {
          chunk += space + remaining;
          remaining = "";
        } else if (chunk) {
          flush();
        } else {
          // Preserve every character even when an unbroken word exceeds the limit.
          const size = chunkLimit();
          chunk = remaining.slice(0, size);
          remaining = remaining.slice(size);
          if (remaining) flush();
        }
      }
    }
    // A complete opening sentence can start playing while later speech is prepared.
    if (!chunks.length && firstLimit < limit) flush();
  }
  flush();
  return chunks;
}

export async function readVoiceJson(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Voice mode could not connect. Please try again.");
  if (!data) throw new Error("The voice service returned an invalid response.");
  return data;
}

export function audioLevel(analyser, samples) {
  analyser.getFloatTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}
