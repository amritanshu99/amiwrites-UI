export async function decodeMono(blob, context, sampleRate, maxSeconds = 60) {
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
  if (!Number.isFinite(decoded.duration) || decoded.duration <= 0 || decoded.duration > maxSeconds) {
    throw new Error(`Use audio shorter than ${maxSeconds} seconds.`);
  }
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const offline = new OfflineContext(1, Math.ceil(decoded.duration * sampleRate), sampleRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return new Float32Array(rendered.getChannelData(0));
}

export function pcmWav(samples, sampleRate = 24000) {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const text = (offset, value) => [...value].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => { const value = Math.max(-1, Math.min(1, sample)); view.setInt16(44 + index * 2, value * (value < 0 ? 32768 : 32767), true); });
  return new Blob([bytes], { type: "audio/wav" });
}

export async function normalizeReference(file) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a recording smaller than 10 MB.");
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("This browser cannot prepare your voice recording. Try Chrome or Edge.");
  const context = new Context();
  try {
    const samples = await decodeMono(file, context, 24000, 30);
    if (samples.length < 5 * 24000) throw new Error("Record at least 5 seconds of your voice.");
    let energy = 0;
    for (const sample of samples) energy += sample * sample;
    if (Math.sqrt(energy / samples.length) < 0.003) throw new Error("The recording is too quiet. Move closer to the microphone.");
    return pcmWav(samples);
  } finally { await context.close(); }
}
