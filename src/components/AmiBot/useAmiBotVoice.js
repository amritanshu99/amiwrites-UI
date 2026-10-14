import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../../config/api";
import { audioLevel, getRecordingOptions, readVoiceJson, speechChunks } from "./voiceAudio";
import BrowserVoiceEngine from "./browserVoiceEngine";
import { decodeMono } from "./browserVoiceAudio";

const quietState = { phase: "idle", level: 0, error: "", transcript: "", reply: "", active: false, muted: false, progress: "", device: "" };

export default function useAmiBotVoice({ onTurn, token, tone }) {
  const [state, setState] = useState(quietState);
  const [status, setStatus] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const runtime = useRef({ generation: 0 });
  const latest = useRef({ onTurn, tone });
  latest.current = { onTurn, tone };
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.Worker && (window.AudioContext || window.webkitAudioContext) && (window.OfflineAudioContext || window.webkitOfflineAudioContext));

  const cleanup = useCallback(() => {
    const r = runtime.current;
    r.generation += 1;
    r.active = false;
    r.controller?.abort();
    window.clearInterval(r.meter);
    window.clearTimeout(r.restart);
    if (r.recorder) {
      r.recorder.onstop = null;
      r.recorder.onerror = null;
      if (r.recorder.state !== "inactive") r.recorder.stop();
    }
    if (r.source) {
      r.source.onended = null;
      try { r.source.stop(); } catch { /* Already ended. */ }
      r.finishPlayback?.();
    }
    r.stream?.getTracks().forEach((track) => track.stop());
    r.mic?.disconnect();
    r.analyser?.disconnect();
    r.context?.close().catch(() => {});
    r.source = null;
    r.stream = null;
    r.context = null;
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setState((previous) => ({ ...previous, phase: "idle", level: 0, active: false, muted: false }));
  }, [cleanup]);

  const fail = useCallback((error) => {
    cleanup();
    runtime.current.engine?.dispose();
    runtime.current.engine = null;
    setModelReady(false);
    const message = error.name === "NotAllowedError" ? "Microphone access was denied. Allow it in your browser’s site settings and try again."
      : error.name === "NotFoundError" ? "No microphone was found. Connect one and try again."
        : error.message || "Voice mode stopped. Please try again.";
    setState((previous) => ({ ...previous, phase: "error", error: message, active: false, level: 0, muted: false }));
  }, [cleanup]);

  const checkStatus = useCallback(async () => {
    const controller = new AbortController();
    runtime.current.statusController?.abort();
    runtime.current.statusController = controller;
    const timeout = window.setTimeout(() => controller.abort(), 70000);
    try {
      const data = await readVoiceJson(await fetch(apiUrl("/api/amibot/voice/browser/status"), { signal: controller.signal }));
      if (runtime.current.statusController === controller) setStatus(data);
    } catch (error) {
      if (runtime.current.statusController === controller) setStatus({ ready: false, message: error.name === "AbortError" ? "Loading voice settings took too long. Please try again." : error.message });
    } finally { window.clearTimeout(timeout); }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);
  useEffect(() => () => {
    cleanup();
    runtime.current.statusController?.abort();
    runtime.current.statusController = null;
    runtime.current.engine?.dispose();
  }, [cleanup]);
  useEffect(() => {
    // Model downloads may continue in the background, but microphone capture may not.
    const hide = () => { if (document.hidden && runtime.current.stream) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [stop]);
  useEffect(() => { stop(); runtime.current.engine?.dispose(); runtime.current.engine = null; setModelReady(false); }, [token, stop]);

  const start = useCallback(async () => {
    if (!supported || !status?.ready || runtime.current.active) return;
    cleanup();
    const r = runtime.current;
    const session = r.generation;
    r.active = true;
    r.muted = false;
    setState({ ...quietState, active: true, phase: "connecting" });
    const isCurrent = (generation) => r.active && generation === r.generation;
    const update = (patch) => setState((previous) => ({ ...previous, ...patch }));

    function listen() {
      if (!r.active || r.muted) return;
      try {
        r.stream.getAudioTracks().forEach((track) => { track.enabled = true; });
        const recorder = new window.MediaRecorder(r.stream, getRecordingOptions());
        const generation = r.generation;
        const chunks = [];
        let size = 0;
        const started = performance.now();
        let lastSpeech = started;
        let speechFrames = 0;
        let heardSpeech = false;
        let noise = 0.006;
        r.recorder = recorder;
        recorder.ondataavailable = ({ data }) => {
          if (data.size) { chunks.push(data); size += data.size; }
          if (size > 8 * 1024 * 1024 && recorder.state === "recording") recorder.stop();
        };
        recorder.onerror = () => { if (isCurrent(generation)) fail(new Error("The microphone recording stopped unexpectedly. Try again.")); };
        recorder.onstop = () => {
          window.clearInterval(r.meter);
          if (!isCurrent(generation)) return;
          r.stream.getAudioTracks().forEach((track) => { track.enabled = false; });
          update({ level: 0 });
          if (!heardSpeech) {
            r.restart = window.setTimeout(listen, 150);
            return;
          }
          processTurn(new Blob(chunks, { type: recorder.mimeType }), generation);
        };
        recorder.start(250);
        update({ phase: "listening", muted: false, error: "" });
        const samples = new Float32Array(r.analyser.fftSize);
        r.meter = window.setInterval(() => {
          if (recorder.state !== "recording") return;
          const rms = audioLevel(r.analyser, samples);
          const now = performance.now();
          if (!heardSpeech && rms < 0.035) noise = noise * 0.96 + rms * 0.04;
          const threshold = Math.max(0.012, Math.min(0.05, noise * 2.8));
          if (rms > threshold) {
            speechFrames += 1;
            if (speechFrames >= 3) heardSpeech = true;
            lastSpeech = now;
          } else { speechFrames = 0; }
          update({ level: Math.min(1, rms * 7) });
          if ((heardSpeech && now - lastSpeech > 1050 && now - started > 800) || now - started > 55000) recorder.stop();
        }, 50);
      } catch (error) { fail(error); }
    }

    async function play(buffer, generation) {
      if (!isCurrent(generation)) return;
      const source = r.context.createBufferSource();
      const analyser = r.context.createAnalyser();
      analyser.fftSize = 256;
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(r.context.destination);
      r.source = source;
      const samples = new Float32Array(analyser.fftSize);
      update({ phase: "speaking" });
      const meter = window.setInterval(() => {
        if (isCurrent(generation)) update({ level: Math.min(1, audioLevel(analyser, samples) * 5) });
      }, 50);
      try {
        await new Promise((resolve) => {
          r.finishPlayback = resolve;
          source.onended = resolve;
          source.start();
        });
      } finally {
        window.clearInterval(meter);
        source.disconnect();
        analyser.disconnect();
        if (r.source === source) { r.source = null; r.finishPlayback = null; }
      }
    }

    async function processTurn(blob, generation) {
      const controller = new AbortController();
      r.controller = controller;
      const timeout = window.setTimeout(() => controller.abort(), 180000);
      try {
        update({ phase: "transcribing", transcript: "", reply: "" });
        const audio = await decodeMono(blob, r.context, 16000);
        if (!isCurrent(generation)) return;
        const transcription = await r.engine.request("transcribe", { audio }, { signal: controller.signal });
        if (!isCurrent(generation)) return;
        if (!transcription.text?.trim()) { update({ transcript: "I didn’t catch that. Please try again." }); listen(); return; }
        update({ phase: "thinking", transcript: transcription.text });
        const reply = await latest.current.onTurn(transcription.text, { signal: controller.signal, language: transcription.language });
        if (!isCurrent(generation)) return;
        if (!reply) throw new Error("AmiBot could not prepare a reply. Please try again.");
        update({ phase: "preparing", reply });
        if (/[\u0900-\u097F]/.test(reply)) throw new Error("This voice model speaks English. Please ask for an English answer; your full reply is in the chat.");
        const parts = speechChunks(reply, 160, 96);
        if (!parts.length) throw new Error("There is no spoken text in this reply. You can read it in the chat.");
        const fetchSpeech = async (text) => {
          const result = await r.engine.request("speak", { text, tone: latest.current.tone }, { signal: controller.signal });
          if (!isCurrent(generation)) return null;
          if (!result.audio?.length) throw new Error("No speech was generated. Please try again.");
          const buffer = r.context.createBuffer(1, result.audio.length, result.sampleRate);
          buffer.copyToChannel(result.audio, 0);
          return buffer;
        };
        // Prepare the next sentence while the current sentence is audible.
        let pending = parts.length ? fetchSpeech(parts[0]).then((buffer) => ({ buffer }), (error) => ({ error })) : null;
        for (let index = 0; index < parts.length; index += 1) {
          const result = await pending;
          if (!isCurrent(generation)) return;
          if (result.error) throw result.error;
          pending = index + 1 < parts.length ? fetchSpeech(parts[index + 1]).then((buffer) => ({ buffer }), (error) => ({ error })) : null;
          await play(result.buffer, generation);
          if (!isCurrent(generation)) return;
          if (pending) update({ phase: "preparing", level: 0 });
        }
        if (isCurrent(generation)) r.restart = window.setTimeout(listen, 300);
      } catch (error) {
        if (isCurrent(generation)) fail(error.name === "AbortError" ? new Error("That voice turn took too long. Please try again.") : error);
      } finally { window.clearTimeout(timeout); }
    }

    r.listen = listen;
    let loadingTimedOut = false;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      r.context = new AudioContext();
      await r.context.resume();
      if (!isCurrent(session)) return;
      const controller = new AbortController();
      r.controller = controller;
      const timeout = window.setTimeout(() => { loadingTimedOut = true; controller.abort(); }, 20 * 60 * 1000);
      let progressNotice;
      const loadingProgress = (progress) => {
        window.clearTimeout(progressNotice);
        update({ progress });
        progressNotice = window.setTimeout(() => {
          if (isCurrent(session)) update({ progress: `${progress} First-time setup can take several minutes. Keep this tab open.` });
        }, 60000);
      };
      try {
        update({ phase: "loading" });
        loadingProgress("Getting AmiBot’s voice recording…");
        const response = await fetch(apiUrl("/api/amibot/voice/browser/reference"), { signal: controller.signal });
        if (!response.ok) await readVoiceJson(response);
        const reference = await response.blob();
        if (reference.size > 1440044) throw new Error("The voice recording is too large. Ask the admin to save it again.");
        const audio = await decodeMono(reference, r.context, 24000, 30);
        if (!isCurrent(session)) return;
        if (!r.engine?.worker) r.engine = new BrowserVoiceEngine();
        loadingProgress("Loading voice models. The first download is about 1.6 GB…");
        const aggregateModels = new Set();
        const loaded = await r.engine.load({ signal: controller.signal, onProgress: (progress) => {
          if (!isCurrent(session)) return;
          if (progress.message) { loadingProgress(progress.message); return; }
          const model = progress.name || "voice";
          const label = model.includes("whisper") ? "speech recognition model" : "voice model";
          const percent = Number.isFinite(progress.progress) ? Math.max(0, Math.min(100, Math.round(progress.progress))) : null;
          if (progress.status === "progress_total" && percent !== null) {
            aggregateModels.add(model);
            loadingProgress(percent === 100 ? `Preparing the ${label} on your device…`
              : `Downloading the ${label}: ${percent}% across its files…`);
          } else if (!aggregateModels.has(model)) {
            loadingProgress(progress.status === "progress" && percent !== null
              ? `Downloading the ${label}: ${percent}% of this file…` : `Preparing the ${label} on your device…`);
          }
        } });
        if (!isCurrent(session)) return;
        update({ device: loaded.device });
        loadingProgress("Preparing Amritanshu’s voice…");
        await r.engine.request("reference", { audio }, { signal: controller.signal });
        if (!isCurrent(session)) return;
        setModelReady(true);
      } finally { window.clearTimeout(timeout); window.clearTimeout(progressNotice); }
      if (document.hidden) { stop(); return; }
      update({ phase: "connecting", progress: "" });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (!isCurrent(session) || document.hidden) {
        stream.getTracks().forEach((track) => track.stop());
        if (isCurrent(session)) stop();
        return;
      }
      r.stream = stream;
      stream.getAudioTracks().forEach((track) => { track.onended = () => { if (r.active) fail(new Error("The microphone disconnected. Reconnect it and start again.")); }; });
      r.analyser = r.context.createAnalyser();
      r.analyser.fftSize = 512;
      r.mic = r.context.createMediaStreamSource(stream);
      r.mic.connect(r.analyser);
      listen();
    } catch (error) {
      if (isCurrent(session)) fail(loadingTimedOut && error.name === "AbortError"
        ? new Error("Voice setup timed out. Keep this tab open and try again on a stable connection.") : error);
    }
  }, [cleanup, fail, status, stop, supported]);

  const interrupt = useCallback(() => {
    const r = runtime.current;
    if (!r.active || !r.stream) return;
    r.generation += 1;
    r.controller?.abort();
    window.clearInterval(r.meter);
    window.clearTimeout(r.restart);
    if (r.recorder?.state === "recording") { r.recorder.onstop = null; r.recorder.stop(); }
    if (r.source) { try { r.source.stop(); } catch { /* Already stopped. */ } }
    r.muted = false;
    r.restart = window.setTimeout(() => r.listen?.(), 250);
    setState((previous) => ({ ...previous, phase: "listening", level: 0, muted: false }));
  }, []);

  const toggleMute = useCallback(() => {
    const r = runtime.current;
    if (!r.active || !r.stream) return;
    if (r.muted) { r.muted = false; r.listen?.(); return; }
    r.generation += 1;
    r.controller?.abort();
    window.clearInterval(r.meter);
    window.clearTimeout(r.restart);
    if (r.recorder?.state === "recording") { r.recorder.onstop = null; r.recorder.stop(); }
    if (r.source) { try { r.source.stop(); } catch { /* Already stopped. */ } }
    r.muted = true;
    r.stream.getAudioTracks().forEach((track) => { track.enabled = false; });
    setState((previous) => ({ ...previous, phase: "paused", muted: true, level: 0 }));
  }, []);

  const sendNow = useCallback(() => {
    if (runtime.current.recorder?.state === "recording") runtime.current.recorder.stop();
  }, []);

  return { ...state, modelReady, status, supported, start, stop, interrupt, toggleMute, sendNow, checkStatus };
}
