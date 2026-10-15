import createVoiceWorker from "./createVoiceWorker";

const aborted = () => new DOMException("Voice operation canceled", "AbortError");

export default class BrowserVoiceEngine {
  constructor() {
    this.worker = createVoiceWorker();
    this.pending = new Map();
    this.sequence = 0;
    this.ready = false;
    this.speechCache = new Map();
    this.cachedBytes = 0;
    this.voiceVersion = 0;
    this.worker.onmessage = ({ data }) => {
      const request = this.pending.get(data.id);
      if (!request) return;
      if (data.type === "progress") { request.onProgress?.(data.data); return; }
      request.finish();
      if (data.type === "error") request.reject(new Error(data.message));
      else {
        if (request.cacheKey && request.voiceVersion === this.voiceVersion && data.data?.audio?.length) {
          const audio = data.data.audio.slice();
          if (audio.byteLength <= 8 * 1024 * 1024) {
            this.cachedBytes -= this.speechCache.get(request.cacheKey)?.audio.byteLength || 0;
            this.speechCache.delete(request.cacheKey);
            this.speechCache.set(request.cacheKey, { ...data.data, audio });
            this.cachedBytes += audio.byteLength;
            while (this.speechCache.size > 12 || this.cachedBytes > 8 * 1024 * 1024) {
              const oldest = this.speechCache.keys().next().value;
              this.cachedBytes -= this.speechCache.get(oldest).audio.byteLength;
              this.speechCache.delete(oldest);
            }
          }
        }
        request.resolve(data.data);
      }
    };
    this.worker.onerror = (event) => {
      event.preventDefault?.();
      this.dispose(new Error("The voice model could not run on this device. Try current Chrome or Edge on a computer with more free memory."));
    };
  }

  request(type, data = {}, { signal, onProgress } = {}) {
    if (signal?.aborted) return Promise.reject(aborted());
    if (!this.worker) return Promise.reject(new Error("Voice models were closed. Start voice mode again."));
    if (type === "reference") {
      this.voiceVersion += 1;
      this.speechCache.clear();
      this.cachedBytes = 0;
    }
    const cacheKey = type === "speak" ? data.text?.trim() : null;
    const cached = this.speechCache.get(cacheKey);
    if (cached) {
      this.speechCache.delete(cacheKey);
      this.speechCache.set(cacheKey, cached);
      return Promise.resolve({ ...cached, audio: cached.audio.slice() });
    }
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const cancel = () => {
        if (!this.pending.has(id)) return;
        if (type === "load") { this.dispose(aborted()); return; }
        this.worker?.postMessage({ type: "cancel", id });
        finish();
        reject(aborted());
      };
      const finish = () => { signal?.removeEventListener("abort", cancel); this.pending.delete(id); };
      this.pending.set(id, { resolve, reject, finish, onProgress, cacheKey, voiceVersion: this.voiceVersion });
      signal?.addEventListener("abort", cancel, { once: true });
      try { this.worker.postMessage({ id, type, data }, data.audio ? [data.audio.buffer] : []); }
      catch (error) { finish(); reject(error); }
    });
  }

  async load(options) {
    if (this.ready) return { device: this.device };
    const result = await this.request("load", {}, options);
    this.ready = true;
    this.device = result.device;
    return result;
  }

  dispose(error = aborted()) {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.speechCache.clear();
    this.cachedBytes = 0;
    for (const request of [...this.pending.values()]) { request.finish(); request.reject(error); }
  }
}
