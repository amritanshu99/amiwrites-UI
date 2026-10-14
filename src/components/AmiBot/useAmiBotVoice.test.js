import { act, renderHook, waitFor } from "@testing-library/react";
import useAmiBotVoice from "./useAmiBotVoice";
import BrowserVoiceEngine from "./browserVoiceEngine";

jest.mock("../../config/api", () => ({ apiUrl: (path) => path }));
jest.mock("./browserVoiceEngine", () => jest.fn());
jest.mock("./browserVoiceAudio", () => ({ decodeMono: jest.fn(async () => new Float32Array(120000)) }));
let engine;
let tracks;
let contexts;
let sources;
let rms;
let mic;
const json = (data) => ({ ok: true, json: async () => data });
const ready = () => json({ ready: true, referenceReady: true, modelReady: true });

class Recorder {
  static isTypeSupported() { return true; }
  constructor() { this.state = "inactive"; this.mimeType = "audio/webm"; }
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

class Context {
  constructor() { contexts.push(this); this.close = jest.fn(async () => {}); }
  resume = async () => {};
  createAnalyser = () => ({ fftSize: 256, getFloatTimeDomainData: (samples) => samples.fill(rms), connect: jest.fn(), disconnect: jest.fn() });
  createMediaStreamSource = () => ({ connect: jest.fn(), disconnect: jest.fn() });
  decodeAudioData = async () => ({ duration: 1 });
  createBuffer = () => ({ copyToChannel: jest.fn() });
  createBufferSource = () => {
    const source = { connect: jest.fn(), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(() => source.onended?.()) };
    sources.push(source);
    return source;
  };
}

beforeEach(() => {
  tracks = [{ stop: jest.fn(), enabled: true }];
  contexts = []; sources = []; rms = 0.1;
  mic = jest.fn(async () => ({ getTracks: () => tracks, getAudioTracks: () => tracks }));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: mic } });
  window.MediaRecorder = Recorder;
  window.AudioContext = Context;
  window.OfflineAudioContext = Context;
  window.Worker = jest.fn();
  engine = { worker: {}, load: jest.fn(async () => ({ device: "wasm" })), dispose: jest.fn(),
    request: jest.fn(async (type) => type === "transcribe" ? { text: "Hello", language: "en" }
      : type === "speak" ? { audio: new Float32Array(24000), sampleRate: 24000 } : { ready: true }) };
  BrowserVoiceEngine.mockImplementation(() => engine);
  global.fetch = jest.fn(async (url) => url.endsWith("/status") ? ready() : { ok: true, blob: async () => new Blob(["reference"]) });
});

afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

async function setup(onTurn = jest.fn(async () => "Hello from AmiBot.")) {
  const hook = renderHook(() => useAmiBotVoice({ onTurn, token: "", language: "auto", tone: "natural" }));
  await waitFor(() => expect(hook.result.current.status?.ready).toBe(true));
  return hook;
}

test("a pause after speech sends the turn, plays the reply, then resumes listening", async () => {
  const onTurn = jest.fn(async () => "Hello from AmiBot.");
  const { result, unmount } = await setup(onTurn);
  jest.useFakeTimers();
  await act(async () => { await result.current.start(); });
  expect(result.current.phase).toBe("listening");
  await act(async () => { jest.advanceTimersByTime(200); rms = 0; jest.advanceTimersByTime(1200); });
  expect(onTurn).toHaveBeenCalledWith("Hello", expect.objectContaining({ language: "en" }));
  expect(result.current.phase).toBe("speaking");
  expect(tracks[0].enabled).toBe(false);
  expect(sources[0].start).toHaveBeenCalledTimes(1);
  await act(async () => { sources[0].onended(); });
  await act(async () => { jest.advanceTimersByTime(300); });
  expect(result.current.phase).toBe("listening");
  expect(tracks[0].enabled).toBe(true);
  unmount();
  expect(tracks[0].stop).toHaveBeenCalled();
  expect(contexts[0].close).toHaveBeenCalled();
  expect(engine.dispose).toHaveBeenCalled();
  expect(global.fetch.mock.calls.every(([url]) => url.endsWith("/status") || url.endsWith("/reference"))).toBe(true);
});

test("microphone denial is actionable and closes the audio context", async () => {
  const { result } = await setup();
  mic.mockRejectedValueOnce(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
  await act(async () => { await result.current.start(); });
  expect(result.current.active).toBe(false);
  expect(result.current.error).toMatch(/microphone access was denied/i);
  expect(contexts[0].close).toHaveBeenCalled();
});

test("closing while permission is pending releases any stream returned later", async () => {
  let allowMic;
  mic.mockImplementationOnce(() => new Promise((resolve) => { allowMic = resolve; }));
  const { result, unmount } = await setup();
  let starting;
  await act(async () => { starting = result.current.start(); });
  unmount();
  await act(async () => {
    allowMic({ getTracks: () => tracks, getAudioTracks: () => tracks });
    await starting;
  });
  expect(tracks[0].stop).toHaveBeenCalled();
  expect(contexts[0].close).toHaveBeenCalled();
});

test("interrupt discards a late answer and resumes microphone capture", async () => {
  let finish;
  const onTurn = jest.fn(() => new Promise((resolve) => { finish = resolve; }));
  const { result, unmount } = await setup(onTurn);
  jest.useFakeTimers();
  await act(async () => { await result.current.start(); jest.advanceTimersByTime(200); result.current.sendNow(); });
  expect(result.current.phase).toBe("thinking");
  await act(async () => { result.current.interrupt(); });
  expect(onTurn.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { finish("This stale answer must not play."); jest.advanceTimersByTime(300); });
  expect(result.current.phase).toBe("listening");
  expect(sources).toHaveLength(0);
  expect(global.fetch).toHaveBeenCalledTimes(2);
  unmount();
});

test("pause disables recording and resume restarts it without uploading silence", async () => {
  const { result, unmount } = await setup();
  await act(async () => { await result.current.start(); });
  act(() => result.current.toggleMute());
  expect(result.current.phase).toBe("paused");
  expect(tracks[0].enabled).toBe(false);
  act(() => result.current.toggleMute());
  expect(result.current.phase).toBe("listening");
  expect(tracks[0].enabled).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(2);
  unmount();
});

test("stopping during model loading never asks for microphone permission or resumes late", async () => {
  let finishLoad;
  engine.load.mockImplementationOnce(() => new Promise((resolve) => { finishLoad = resolve; }));
  const { result, unmount } = await setup();
  let starting;
  await act(async () => { starting = result.current.start(); });
  expect(result.current.phase).toBe("loading");
  const signal = engine.load.mock.calls[0][0].signal;
  act(() => result.current.stop());
  expect(signal.aborted).toBe(true);
  await act(async () => { finishLoad({ device: "wasm" }); await starting; });
  expect(result.current.phase).toBe("idle");
  expect(mic).not.toHaveBeenCalled();
  expect(engine.request).not.toHaveBeenCalled();
  unmount();
});
