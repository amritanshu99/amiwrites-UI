import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../../config/api";
import { audioLevel, getRecordingOptions, readVoiceJson, recordingName, speechChunks } from "./voiceAudio";

const quietState = { phase: "idle", level: 0, error: "", transcript: "", reply: "", active: false, muted: false };

export default function useAmiBotVoice({ onTurn, token, language, tone }) {
  const [state, setState] = useState(quietState);
  const [status, setStatus] = useState(null);
  const runtime = useRef({ generation: 0 });
  const latest = useRef({ onTurn, token, language, tone });
  latest.current = { onTurn, token, language, tone };
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && (window.AudioContext || window.webkitAudioContext));

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
    const message = error.name === "NotAllowedError" ? "Microphone access was denied. Allow it in your browser’s site settings and try again."
      : error.name === "NotFoundError" ? "No microphone was found. Connect one and try again."
        : error.message || "Voice mode stopped. Please try again.";
    setState((previous) => ({ ...previous, phase: "error", error: message, active: false, level: 0, muted: false }));
  }, [cleanup]);

  const checkStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const data = await readVoiceJson(await fetch(apiUrl("/api/amibot/voice/status"), { signal: controller.signal }));
      setStatus(data);
    } catch (error) {
      setStatus({ ready: false, message: error.name === "AbortError" ? "The voice service is taking too long to connect." : error.message });
    } finally { window.clearTimeout(timeout); }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);
  useEffect(() => cleanup, [cleanup]);
  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [stop]);
  useEffect(() => { stop(); }, [token, stop]);

  const start = useCallback(async () => {
    if (!supported || !status?.ready || runtime.current.active) return;
    cleanup();
    const r = runtime.current;
    const session = r.generation;
    r.active = true;
    r.muted = false;
    setState({ ...quietState, active: true, phase: "connecting" });
    const isCurrent = (generation) => r.active && generation === r.generation;
    const headers = () => latest.current.token ? { Authorization: `Bearer ${latest.current.token}` } : {};
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
        const form = new FormData();
        form.append("audio", blob, recordingName(blob.type));
        form.append("language", latest.current.language);
        const transcription = await readVoiceJson(await fetch(apiUrl("/api/amibot/voice/transcribe"), {
          method: "POST", headers: headers(), body: form, signal: controller.signal,
        }));
        if (!isCurrent(generation)) return;
        if (!transcription.text?.trim()) { update({ transcript: "I didn’t catch that. Please try again." }); listen(); return; }
        update({ phase: "thinking", transcript: transcription.text });
        const reply = await latest.current.onTurn(transcription.text, { signal: controller.signal, language: transcription.language });
        if (!isCurrent(generation)) return;
        if (!reply) throw new Error("AmiBot could not prepare a reply. Please try again.");
        update({ phase: "preparing", reply });
        const parts = speechChunks(reply);
        const fetchSpeech = async (text) => {
          const response = await fetch(apiUrl("/api/amibot/voice/speech"), {
            method: "POST", headers: { "Content-Type": "application/json", ...headers() }, signal: controller.signal,
            body: JSON.stringify({ text, language: /[\u0900-\u097F]/.test(text) ? "hi" : "en", tone: latest.current.tone }),
          });
          if (!response.ok) await readVoiceJson(response);
          const bytes = await response.arrayBuffer();
          if (!isCurrent(generation)) return null;
          return r.context.decodeAudioData(bytes);
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
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      r.context = new AudioContext();
      await r.context.resume();
      if (!isCurrent(session)) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (!isCurrent(session)) { stream.getTracks().forEach((track) => track.stop()); return; }
      r.stream = stream;
      stream.getAudioTracks().forEach((track) => { track.onended = () => { if (r.active) fail(new Error("The microphone disconnected. Reconnect it and start again.")); }; });
      r.analyser = r.context.createAnalyser();
      r.analyser.fftSize = 512;
      r.mic = r.context.createMediaStreamSource(stream);
      r.mic.connect(r.analyser);
      listen();
    } catch (error) { if (isCurrent(session)) fail(error); }
  }, [cleanup, fail, status, supported]);

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

  return { ...state, status, supported, start, stop, interrupt, toggleMute, sendNow, checkStatus };
}
