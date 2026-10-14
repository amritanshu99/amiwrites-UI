export default function createVoiceWorker() {
  return new Worker(new URL("./browserVoiceWorker.js", import.meta.url), { type: "module", name: "amibot-voice" });
}
