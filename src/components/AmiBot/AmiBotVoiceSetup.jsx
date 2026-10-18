import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, UploadCloud } from "lucide-react";
import { apiUrl } from "../../config/api";
import { getRecordingOptions, readVoiceJson, recordingName } from "./voiceAudio";
import { normalizeReference } from "./browserVoiceAudio";

export default function AmiBotVoiceSetup() {
  const [sample, setSample] = useState(null);
  const [preview, setPreview] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [consent, setConsent] = useState(false);
  const [sharingConsent, setSharingConsent] = useState(false);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const resources = useRef({});
  const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-white/15";

  useEffect(() => {
    if (!sample) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(sample);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sample]);

  useEffect(() => {
    const resource = resources.current;
    resource.disposed = false;
    const statusController = new AbortController();
    fetch(apiUrl("/api/amibot/voice/browser/status"), { signal: statusController.signal })
      .then(readVoiceJson).then((status) => { if (!statusController.signal.aborted) setSaved(status.ready); })
      .catch(() => {});
    return () => {
      statusController.abort();
      resource.disposed = true;
      window.clearInterval(resource.timer);
      resource.controller?.abort();
      if (resource.recorder) {
        resource.recorder.onstop = null;
        if (resource.recorder.state === "recording") resource.recorder.stop();
      }
      resource.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function record() {
    if (busy || recording) return;
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice("Recording is unavailable in this browser. Upload an audio file instead."); return;
    }
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (resources.current.disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
      resources.current.stream = stream;
      const recorder = new window.MediaRecorder(stream, getRecordingOptions());
      resources.current.recorder = recorder;
      const chunks = [];
      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
      recorder.onstop = () => {
        window.clearInterval(resources.current.timer);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (!chunks.length) { setNotice("No audio was captured. Please try again."); return; }
        setSample(new File(chunks, recordingName(recorder.mimeType), { type: recorder.mimeType }));
      };
      recorder.onerror = () => {
        window.clearInterval(resources.current.timer);
        recorder.onstop = null;
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setNotice("Recording failed. Check your microphone and try again.");
      };
      recorder.start(250);
      setRecording(true);
      setSeconds(0);
      const started = Date.now();
      resources.current.timer = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= 29 && recorder.state === "recording") recorder.stop();
      }, 250);
    } catch {
      resources.current.stream?.getTracks().forEach((track) => track.stop());
      setNotice("Allow microphone access to record, or upload a saved recording.");
    } finally { if (!resources.current.disposed) setBusy(false); }
  }

  async function save() {
    if (!sample || !consent || !sharingConsent || busy) return;
    setBusy(true);
    setNotice("");
    const controller = new AbortController();
    resources.current.controller = controller;
    const timeout = window.setTimeout(() => controller.abort(), 120000);
    try {
      const normalized = await normalizeReference(sample);
      if (controller.signal.aborted) throw new DOMException("Saving cancelled", "AbortError");
      const form = new FormData();
      form.append("audio", normalized, "amibot-voice.wav");
      form.append("consent", "true");
      form.append("browserSharingConsent", "true");
      const token = localStorage.getItem("token");
      const result = await readVoiceJson(await fetch(apiUrl("/api/amibot/admin/voice/browser/reference"), {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form, signal: controller.signal,
      }));
      if (!resources.current.disposed) { setSaved(true); setNotice(`Voice saved (${result.duration}s). Visitors can now start browser voice mode using your recording.`); }
    } catch (error) {
      if (!resources.current.disposed) setNotice(error.name === "AbortError" ? "Saving took too long. Please try again." : error.message);
    } finally {
      window.clearTimeout(timeout);
      if (!resources.current.disposed) setBusy(false);
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-zinc-800 dark:bg-zinc-950" aria-label="AmiBot voice setup">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Mic className="h-5 w-5 text-cyan-600" /> Your voice, in AmiBot</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-zinc-300">Record 5–30 seconds of clear English in your usual tone. AmiBot generates the cloned voice in each visitor’s browser, with no paid voice service or extra hosting. Each device downloads about 230–360 MB of models the first time. The first ten seconds of your recording provide the voice sample.</p>
      {saved !== null && <p className="mt-2 text-sm text-cyan-700 dark:text-cyan-300" role="status">{saved ? "Browser voice is set up. Saving again replaces the recording." : "Save your voice below to enable browser voice mode."}</p>}
      <blockquote className="my-4 border-l-2 border-cyan-300 pl-4 text-sm leading-6 text-slate-500 dark:text-zinc-400">“Hi, I’m Amritanshu. Welcome to AmiVerse. I enjoy building things, sharing ideas, and learning something new every day. Ask me about my projects, my writing, or what I’m working on. Let’s talk.”</blockquote>
      <div className="flex flex-wrap items-center gap-3">
        {recording ? <button className={buttonClass} type="button" onClick={() => resources.current.recorder?.stop()}><Square size={16} /> Stop recording · {seconds}s</button>
          : <button className={buttonClass} type="button" disabled={busy} onClick={record}><Mic size={16} /> Record my voice</button>}
        <label className={`${buttonClass} cursor-pointer`}><UploadCloud size={16} /> Upload recording
          <input type="file" className="max-w-[220px] text-xs" aria-label="Voice reference recording" accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac" disabled={busy || recording} onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { setNotice("Choose a recording smaller than 10 MB."); return; }
            setSample(file); setNotice("");
          }} />
        </label>
      </div>
      {preview && <audio className="mt-4 max-w-full" src={preview} controls aria-label="Preview voice recording" />}
      <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> This is my voice, and I want AmiBot to use an AI version of it for spoken replies.</label>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={sharingConsent} onChange={(event) => setSharingConsent(event.target.checked)} /> I understand this recording is public: visitors’ browsers download it to create the voice, and anyone with access can save a copy.</label>
      <button type="button" className={`${buttonClass} mt-4 bg-cyan-700 text-white`} disabled={!sample || !consent || !sharingConsent || busy || recording} onClick={save}>{busy ? "Please wait…" : "Save AmiBot voice"}</button>
      {notice && <p className="mt-3 text-sm leading-6" role="status">{notice}</p>}
    </section>
  );
}
