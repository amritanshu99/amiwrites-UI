// Schedule PCM on one Web Audio clock. Buffer enough speech to cover measured
// inference time before starting, instead of starving after a tiny first phrase.
export default class VoiceStreamPlayer {
  constructor(context, { words, onStarted, onLevel }) {
    this.context = context;
    this.onStarted = onStarted;
    this.onLevel = onLevel;
    this.expectedSeconds = Math.max(1, words * 0.46);
    this.began = performance.now();
    this.pending = [];
    this.sources = new Set();
    this.seconds = 0;
    this.started = false;
    this.ended = false;
    this.stopped = false;
    this.nextTime = 0;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(context.destination);
    this.finished = new Promise((resolve) => { this.resolve = resolve; });
  }

  append({ audio, sampleRate }) {
    if (this.stopped || !audio?.length) return;
    if (this.sampleRate && this.sampleRate !== sampleRate) throw new Error("The voice audio format changed. Please try again.");
    this.sampleRate = sampleRate;
    this.seconds += audio.length / sampleRate;
    this.pending.push({ audio, sampleRate });
    const elapsed = (performance.now() - this.began) / 1000;
    const factor = Math.max(1, elapsed / this.seconds * 1.15);
    const lead = Math.min(this.expectedSeconds, this.expectedSeconds * (factor - 1) / factor + 1);
    if (this.started || this.seconds >= lead) this.flush();
  }

  flush() {
    if (this.stopped || !this.pending.length) return;
    if (!this.started) {
      this.started = true;
      this.onStarted?.();
      const samples = new Float32Array(this.analyser.fftSize);
      this.meter = setInterval(() => {
        this.analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const value of samples) sum += value * value;
        this.onLevel?.(Math.min(1, Math.sqrt(sum / samples.length) * 5));
      }, 50);
    }
    for (const { audio, sampleRate } of this.pending.splice(0)) {
      const buffer = this.context.createBuffer(1, audio.length, sampleRate);
      buffer.copyToChannel(audio, 0);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);
      const start = Math.max(this.context.currentTime + 0.04, this.nextTime);
      this.nextTime = start + audio.length / sampleRate;
      this.sources.add(source);
      source.onended = () => {
        source.disconnect();
        this.sources.delete(source);
        if (this.ended && !this.sources.size) this.stop();
      };
      source.start(start);
    }
  }

  finish() {
    this.ended = true;
    this.flush();
    if (!this.sources.size) this.stop();
    return this.finished;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    clearInterval(this.meter);
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* Already ended. */ }
      source.disconnect();
    }
    this.sources.clear();
    this.pending = [];
    this.analyser.disconnect();
    this.onLevel?.(0);
    this.resolve();
  }
}
