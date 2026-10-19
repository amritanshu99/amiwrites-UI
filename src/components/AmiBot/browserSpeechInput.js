export const hasBrowserSpeech = () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export const preferredSpeechMode = () => hasBrowserSpeech() && /Android|iPhone|iPad/i.test(navigator.userAgent) ? "browser" : "local";

export function preferredSpeechLanguage() {
  const languages = navigator.languages || [navigator.language];
  return languages.find((language) => ["en-IN", "en-US", "en-GB"].includes(language)) || "en-IN";
}

// One recognition session per turn. Android can re-emit the entire result list:
// rebuild the caption instead of appending repeated interim/final words.
export default class BrowserSpeechInput {
  constructor({ language, onListening, onTranscript, onComplete, onError }) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new Recognition();
    this.active = true;
    this.finalText = "";
    const recognition = this.recognition;
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const fail = (message, name = "Error") => {
      if (!this.active) return;
      this.cancel();
      onError(Object.assign(new Error(message), { name }));
    };
    recognition.onstart = () => { if (this.active) onListening(); };
    recognition.onspeechend = () => { this.finishedAt = performance.now(); };
    recognition.onresult = ({ results }) => {
      if (!this.active) return;
      const final = [], interim = [];
      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        (result.isFinal ? final : interim).push(result[0]?.transcript || "");
      }
      this.finalText = final.join(" ").replace(/\s+/g, " ").trim();
      onTranscript([...final, ...interim].join(" ").replace(/\s+/g, " ").trim());
      // Wait for onend before replying so the recognizer cannot hear AmiBot.
      if (this.finalText) this.stop();
    };
    recognition.onerror = ({ error }) => {
      if (error === "no-speech") return; // onend produces an empty turn, never a guessed transcript.
      if (error === "not-allowed") fail("Microphone access was denied.", "NotAllowedError");
      else if (error === "audio-capture") fail("Chrome could not open the microphone. Close other recording apps and try again.");
      else if (error === "language-not-supported") fail("This speech language is unavailable. Choose another language and try again.");
      else fail("Browser speech recognition could not connect. Check your connection, or choose On-device English and try again.");
    };
    recognition.onend = () => {
      if (!this.active) return;
      const text = this.finalText;
      const finishedAt = this.finishedAt || performance.now();
      this.detach();
      onComplete(text, finishedAt);
    };
    this.fail = fail;
  }

  start() {
    this.limit = window.setTimeout(() => this.stop(), 55000);
    try { this.recognition.start(); }
    catch (error) { this.fail(error.message, error.name); }
  }

  stop() {
    if (!this.active || this.stopping) return;
    this.stopping = true;
    this.finishedAt ||= performance.now();
    this.endTimeout = window.setTimeout(() => this.fail("Speech recognition did not finish. Please start again."), 5000);
    try { this.recognition.stop(); }
    catch (error) { this.fail(error.message, error.name); }
  }

  detach() {
    this.active = false;
    window.clearTimeout(this.limit);
    window.clearTimeout(this.endTimeout);
    for (const event of ["onstart", "onspeechend", "onresult", "onerror", "onend"]) this.recognition[event] = null;
  }

  cancel() {
    this.detach();
    try { this.recognition.abort(); } catch (_) { /* Already closed by the browser. */ }
  }
}
