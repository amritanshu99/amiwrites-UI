import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, AudioLines, Mic, MicOff, PhoneOff, SendHorizontal } from "lucide-react";
import useAmiBotVoice from "./useAmiBotVoice";
import { hasBrowserSpeech, preferredSpeechLanguage, preferredSpeechMode } from "./browserSpeechInput";
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
  const [recognitionMode, setRecognitionMode] = useState(preferredSpeechMode);
  const [speechLanguage, setSpeechLanguage] = useState(preferredSpeechLanguage);
  const [browserSpeechAccepted, setBrowserSpeechAccepted] = useState(false);
  const voice = useAmiBotVoice({ onTurn, token, recognitionMode, speechLanguage, browserSpeechAccepted });
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

        {!voice.active && hasBrowserSpeech() && <>
          <div className="amibot-voice-options">
            <label>Speech recognition
              <select value={recognitionMode} onChange={(event) => setRecognitionMode(event.target.value)}>
                <option value="browser">Browser speech (recommended on phones)</option>
                <option value="local">On-device English</option>
              </select>
            </label>
            {recognitionMode === "browser" && <label>Speaking language
              <select value={speechLanguage} onChange={(event) => setSpeechLanguage(event.target.value)}>
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            </label>}
          </div>
          {recognitionMode === "browser" && <label className="amibot-voice-download">
            <input type="checkbox" checked={browserSpeechAccepted} onChange={(event) => setBrowserSpeechAccepted(event.target.checked)} />
            <span>Allow my browser's speech service to process microphone audio. Internet is required. AmiBot still replies in Amritanshu's cloned voice, in English.</span>
          </label>}
        </>}
        {!voice.active && !voice.modelReady && (
          <label className="amibot-voice-download">
            <input type="checkbox" checked={downloadAccepted} onChange={(event) => setDownloadAccepted(event.target.checked)} />
            <span>Download about {recognitionMode === "browser" ? "150–200" : "230–360"} MB for voice mode. Models are cached when storage is available. Keep this page open while speaking.</span>
          </label>
        )}
        {voice.phase === "loading" && <p className="amibot-voice-progress" role="status">{voice.progress}</p>}
        {voice.active && voice.device === "wasm" && <p className="amibot-voice-description">Your browser is using one CPU thread. Longer replies may need more time.</p>}

        {voice.transcript && <div className="amibot-voice-caption"><span>YOU</span><p>{voice.transcript}</p></div>}
        {voice.responseMs != null && <p className="amibot-voice-description">Reply started in {(voice.responseMs / 1000).toFixed(1)} seconds</p>}
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
          <button type="button" className="amibot-voice-primary" onClick={voice.start} disabled={!voice.supported || !voice.status?.ready || (!voice.modelReady && !downloadAccepted) || (recognitionMode === "browser" && !browserSpeechAccepted)}><Mic size={19} /> {voice.modelReady ? "Start conversation" : "Download & start"}</button>
        )}
        <p><a href="/voice/NOTICE.txt" target="_blank" rel="noreferrer">Voice credits</a> · AI-generated voice · English replies · {recognitionMode === "browser" ? "Input audio uses your browser's speech service; text goes to AmiBot" : "Audio stays on your device; text goes to AmiBot"}</p>
      </div>
    </section>
  );
}
