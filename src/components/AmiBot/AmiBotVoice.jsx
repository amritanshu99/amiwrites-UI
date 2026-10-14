import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, AudioLines, Mic, MicOff, PhoneOff, SendHorizontal } from "lucide-react";
import useAmiBotVoice from "./useAmiBotVoice";
import "./AmiBotVoice.css";

const phases = {
  idle: ["A little more human.", "Speak naturally. AmiBot will reply in Amritanshu’s AI voice."],
  connecting: ["Getting ready", "Connecting your microphone…"],
  loading: ["Making room for your voice", "Keep this tab open while the voice models load."],
  listening: ["I’m listening", "Take your time. A short pause sends your message."],
  transcribing: ["Got it", "Listening back to what you said…"],
  thinking: ["Let me think", "Finding an answer in AmiVerse knowledge…"],
  preparing: ["Finding my voice", "Your reply is on its way…"],
  speaking: ["AmiBot is speaking", "You can interrupt whenever you like."],
  paused: ["Take a moment", "Your microphone is paused. Resume when you’re ready."],
  error: ["Let’s try that again", "Your conversation is still in the chat."],
};

export default function AmiBotVoice({ onClose, onTurn, token }) {
  const [downloadAccepted, setDownloadAccepted] = useState(false);
  const [tone, setTone] = useState("natural");
  const voice = useAmiBotVoice({ onTurn, token, tone });
  const closeRef = useRef(null);
  const [title, description] = voice.phase === "idle" && voice.modelReady
    ? ["Ready to talk", "Start to turn on your microphone and continue."] : phases[voice.phase];
  const starting = voice.phase === "connecting" || voice.phase === "loading";

  useEffect(() => {
    closeRef.current?.focus();
    const keydown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose]);

  return (
    <section className="amibot-voice" aria-label="AmiBot voice conversation" data-phase={voice.phase}>
      <div className="amibot-voice-top">
        <button ref={closeRef} onClick={onClose} className="amibot-voice-back" type="button"><ArrowLeft size={17} /> Back to chat</button>
        <span className="amibot-voice-badge"><span /> VOICE MODE</span>
      </div>

      <div className="amibot-voice-body">
        <div className="amibot-voice-orbit" aria-hidden="true" style={{ "--voice-level": voice.level }}>
          <div className="amibot-voice-halo" />
          <div className="amibot-voice-ring amibot-voice-ring-one" />
          <div className="amibot-voice-ring amibot-voice-ring-two" />
          <div className="amibot-voice-orb"><div className="amibot-voice-shimmer" /><AudioLines size={42} strokeWidth={1.3} /></div>
        </div>
        <div className="amibot-voice-wave" aria-hidden="true">
          {Array.from({ length: 19 }, (_, index) => (
            <span key={index} style={{ height: `${4 + voice.level * (14 + 24 * Math.sin((index + 1) * 1.9) ** 2)}px` }} />
          ))}
        </div>
        <p className="amibot-voice-eyebrow">AMIBOT · AMRITANSHU’S AI VOICE</p>
        <h3 aria-live="polite">{title}</h3>
        <p className="amibot-voice-description">{description}</p>

        {!voice.active && (
          <div className="amibot-voice-options">
            <label>Speaking tone<select value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="natural">Natural</option><option value="calm">Calm</option><option value="expressive">Expressive</option>
            </select></label>
          </div>
        )}

        {!voice.active && !voice.modelReady && (
          <label className="amibot-voice-download">
            <input type="checkbox" checked={downloadAccepted} onChange={(event) => setDownloadAccepted(event.target.checked)} />
            <span>Download about 1.6 GB of voice models to this browser. English only; best on a recent laptop or desktop. Replies can take a while on slower devices. Models are cached when storage is available.</span>
          </label>
        )}
        {voice.phase === "loading" && <p className="amibot-voice-progress" role="status">{voice.progress}</p>}
        {voice.active && voice.device === "wasm" && <p className="amibot-voice-description">Your device is using its CPU. Voice replies may be slow.</p>}

        {voice.transcript && <div className="amibot-voice-caption"><span>YOU</span><p>{voice.transcript}</p></div>}
        {voice.reply && <div className="amibot-voice-caption"><span>AMIBOT</span><p>{voice.reply}</p></div>}
        {voice.error && <p className="amibot-voice-notice" role="alert">{voice.error}</p>}
        {!voice.supported && <p className="amibot-voice-notice" role="alert">Voice mode needs microphone recording support and a secure connection. Open AmiVerse over HTTPS in a current browser.</p>}
        {voice.supported && !voice.active && !voice.status?.ready && (
          <div className="amibot-voice-notice" role="status">
            {voice.status?.message || "Checking voice availability…"}
            {voice.status && <button type="button" onClick={voice.checkStatus}>Check again</button>}
          </div>
        )}
      </div>

      <div className="amibot-voice-bottom">
        {voice.active ? (
          <div className="amibot-voice-controls">
            <button type="button" disabled={starting} className="amibot-voice-control" onClick={voice.toggleMute} aria-label={voice.muted ? "Resume microphone" : "Pause microphone"} aria-pressed={voice.muted}>{voice.muted ? <MicOff size={21} /> : <Mic size={21} />}</button>
            {voice.phase === "listening" ? (
              <button type="button" className="amibot-voice-primary" onClick={voice.sendNow}><SendHorizontal size={17} /> Send now</button>
            ) : voice.phase === "paused" ? (
              <button type="button" className="amibot-voice-primary" onClick={voice.toggleMute}><Mic size={17} /> Resume</button>
            ) : (
              <button type="button" disabled={starting} className="amibot-voice-primary" onClick={voice.interrupt}><Mic size={17} /> Interrupt</button>
            )}
            <button type="button" className="amibot-voice-control amibot-voice-end" onClick={voice.stop} aria-label="End voice conversation"><PhoneOff size={21} /></button>
          </div>
        ) : (
          <button type="button" className="amibot-voice-primary" onClick={voice.start} disabled={!voice.supported || !voice.status?.ready || (!voice.modelReady && !downloadAccepted)}><Mic size={19} /> {voice.modelReady ? "Start conversation" : "Download & start"}</button>
        )}
        <p>AI-generated voice · English · {voice.active ? "Microphone pauses during replies" : "Audio stays on your device; text goes to AmiBot"}</p>
      </div>
    </section>
  );
}
