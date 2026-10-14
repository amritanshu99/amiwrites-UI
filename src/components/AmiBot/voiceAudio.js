export function getRecordingOptions() {
  const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
    .find((type) => window.MediaRecorder?.isTypeSupported?.(type));
  return mimeType ? { mimeType, audioBitsPerSecond: 64000 } : {};
}

export function recordingName(type = "") {
  return `recording.${type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"}`;
}

export function speechChunks(markdown, maxCharacters = 400) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " See the code in the chat. ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\s+/g, " ").trim();
  const sentences = text.match(/[^.!?।]+[.!?।]*\s*/g) || [];
  const chunks = [];
  for (const sentence of sentences) {
    for (const word of sentence.trim().split(/\s+/)) {
      if (!word) continue;
      // A hard limit also covers long unbroken strings.
      for (let offset = 0; offset < word.length; offset += maxCharacters) {
        const part = word.slice(offset, offset + maxCharacters);
        const last = chunks.length - 1;
        if (last >= 0 && chunks[last].length + part.length + 1 <= maxCharacters) chunks[last] += ` ${part}`;
        else chunks.push(part);
      }
    }
    // Start a new request at sentence boundaries once enough speech is available.
    if (chunks.at(-1)?.length >= 100) chunks.push("");
  }
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
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
