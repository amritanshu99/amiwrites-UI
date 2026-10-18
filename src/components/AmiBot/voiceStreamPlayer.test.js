import VoiceStreamPlayer from "./voiceStreamPlayer";

let now, sources, context;
beforeEach(() => {
  jest.useFakeTimers(); now = 0; sources = [];
  jest.spyOn(performance, "now").mockImplementation(() => now * 1000);
  context = {
    get currentTime() { return now; }, destination: {},
    createAnalyser: () => ({ connect: jest.fn(), disconnect: jest.fn(), getFloatTimeDomainData: data => data.fill(0.1) }),
    createBuffer: (channels, length, rate) => ({ duration: length / rate, copyToChannel: jest.fn() }),
    createBufferSource: () => {
      const source = { connect: jest.fn(), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn() };
      sources.push(source); return source;
    },
  };
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

test("buffers slower-than-playback inference, then schedules continuous PCM with no gaps", async () => {
  const onStarted = jest.fn(), onLevel = jest.fn();
  const player = new VoiceStreamPlayer(context, { words: 50, onStarted, onLevel });
  let startedAt;
  for (let index = 0; index < 22; index += 1) {
    now += 1.65;
    player.append({ audio: new Float32Array(24000), sampleRate: 24000 });
    if (player.started && startedAt == null) startedAt = now;
  }
  expect(startedAt).toBeLessThan(25);
  expect(startedAt).toBeGreaterThan(10);
  expect(onStarted).toHaveBeenCalledTimes(1);
  expect(sources).toHaveLength(22);
  const starts = sources.map(source => source.start.mock.calls[0][0]);
  for (let index = 1; index < starts.length; index += 1) expect(starts[index]).toBeCloseTo(starts[index - 1] + 1);
  const finished = player.finish();
  sources.forEach(source => source.onended());
  await finished;
  expect(player.stopped).toBe(true);
});

test("cached complete audio starts immediately and stopping cancels every scheduled source", async () => {
  const player = new VoiceStreamPlayer(context, { words: 50 });
  player.append({ audio: new Float32Array(24000 * 10), sampleRate: 24000 });
  player.append({ audio: new Float32Array(24000), sampleRate: 24000 });
  expect(player.started).toBe(true);
  player.stop();
  await player.finished;
  for (const source of sources) expect(source.stop).toHaveBeenCalledTimes(1);
  player.append({ audio: new Float32Array(24000), sampleRate: 24000 });
  expect(sources).toHaveLength(2);
});

test("generation completion plays a short answer without waiting for the duration estimate", async () => {
  const player = new VoiceStreamPlayer(context, { words: 50 });
  now = 2;
  player.append({ audio: new Float32Array(24000), sampleRate: 24000 });
  expect(sources).toHaveLength(0);
  const finished = player.finish();
  expect(sources).toHaveLength(1);
  sources[0].onended();
  await finished;
});
