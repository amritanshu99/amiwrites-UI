import createVoiceWorker from "./createVoiceWorker";

const aborted = () => new DOMException("Voice operation canceled", "AbortError");

export default class BrowserVoiceEngine {
  constructor() {
    this.worker = createVoiceWorker();
    this.pending = new Map();
    this.sequence = 0;
    this.ready = false;
    this.worker.onmessage = ({ data }) => {
      const request = this.pending.get(data.id);
      if (!request) return;
      if (data.type === "progress") { request.onProgress?.(data.data); return; }
      request.finish();
      if (data.type === "error") request.reject(new Error(data.message));
      else request.resolve(data.data);
    };
    this.worker.onerror = (event) => {
      event.preventDefault?.();
      this.dispose(new Error("The voice model could not run on this device. Try current Chrome or Edge on a computer with more free memory."));
    };
  }

  request(type, data = {}, { signal, onProgress } = {}) {
    if (signal?.aborted) return Promise.reject(aborted());
    if (!this.worker) return Promise.reject(new Error("Voice models were closed. Start voice mode again."));
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
      this.pending.set(id, { resolve, reject, finish, onProgress });
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
    for (const request of [...this.pending.values()]) { request.finish(); request.reject(error); }
  }
}
