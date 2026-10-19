import BrowserSpeechInput, { preferredSpeechMode } from "./browserSpeechInput";

let recognition;
beforeEach(() => {
  jest.useFakeTimers();
  window.webkitSpeechRecognition = jest.fn(() => {
    recognition = { start: jest.fn(), stop: jest.fn(), abort: jest.fn() };
    return recognition;
  });
});
afterEach(() => { delete window.webkitSpeechRecognition; jest.useRealTimers(); jest.restoreAllMocks(); });
const result = (text, isFinal) => Object.assign([{ transcript: text }], { isFinal });
function setup() {
  const handlers = { language: "en-IN", onListening: jest.fn(), onTranscript: jest.fn(), onComplete: jest.fn(), onError: jest.fn() };
  const input = new BrowserSpeechInput(handlers);
  input.start();
  return { input, ...handlers };
}

test("Android interim and repeated final results produce one corrected turn after the mic closes", () => {
  const { onTranscript, onComplete } = setup();
  expect(recognition).toMatchObject({ lang: "en-IN", continuous: false, interimResults: true });
  recognition.onresult({ results: [result("What skill", false)] });
  recognition.onresult({ results: [result("What skills are listed?", true)] });
  recognition.onresult({ results: [result("What skills are listed?", true)] });
  expect(onTranscript).toHaveBeenLastCalledWith("What skills are listed?");
  expect(recognition.stop).toHaveBeenCalledTimes(1);
  expect(onComplete).not.toHaveBeenCalled();
  const end = recognition.onend;
  end(); end();
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledWith("What skills are listed?", expect.any(Number));
});

test("unfinished interim guesses are never submitted as the user's words", () => {
  const { onComplete, onError } = setup();
  recognition.onresult({ results: [result("wrong partial guess", false)] });
  recognition.onerror({ error: "no-speech" });
  recognition.onend();
  expect(onComplete).toHaveBeenCalledWith("", expect.any(Number));
  expect(onError).not.toHaveBeenCalled();
});

test("cancel ignores late native callbacks and releases the microphone", () => {
  const { input, onTranscript, onComplete, onError } = setup();
  const late = { result: recognition.onresult, end: recognition.onend, error: recognition.onerror };
  input.cancel();
  late.result({ results: [result("must not send", true)] });
  late.end(); late.error({ error: "network" });
  jest.runOnlyPendingTimers();
  expect(recognition.abort).toHaveBeenCalledTimes(1);
  expect(onTranscript).not.toHaveBeenCalled();
  expect(onComplete).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

test.each(["network", "not-allowed", "audio-capture", "language-not-supported"])("%s errors stop capture and never retry permission in a loop", (error) => {
  const { onError, onComplete } = setup();
  recognition.onerror({ error });
  jest.runOnlyPendingTimers();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onComplete).not.toHaveBeenCalled();
  expect(recognition.abort).toHaveBeenCalledTimes(1);
  expect(recognition.start).toHaveBeenCalledTimes(1);
});

test("a hung recognition session times out and releases capture", () => {
  const { onError } = setup();
  jest.advanceTimersByTime(60000);
  expect(recognition.stop).toHaveBeenCalledTimes(1);
  expect(recognition.abort).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/did not finish/) }));
});

test("phones prefer available browser recognition but unsupported browsers stay local", () => {
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; SM-G990B) Chrome/130 Mobile");
  expect(preferredSpeechMode()).toBe("browser");
  delete window.webkitSpeechRecognition;
  expect(preferredSpeechMode()).toBe("local");
});
