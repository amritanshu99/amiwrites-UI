# AmiBot browser voice

AmiBot uses Chatterbox Turbo ONNX for the owner's cloned voice and Whisper base.en for
speech recognition, through pinned Transformers.js 4.3.1. Both run in a dedicated
Web Worker on the visitor's device. The existing AmiBot text endpoint still
answers questions using the existing knowledge and history. It retains its current
provider, limits, and any existing costs; this change adds no paid voice API or host.

## Owner setup

1. Deploy the matching backend browser-voice routes and this frontend.
2. Sign in as the existing admin and open `/amibot-admin` (Ami Pulse).
3. Under **Your voice, in AmiBot**, record or upload 5–30 seconds of clear English.
4. Preview it and confirm both ownership and public reference sharing.
5. Choose **Save AmiBot voice**, then open AmiBot's microphone button.

The browser converts the reference to mono 24 kHz PCM16 WAV. Express validates
its format, duration, and volume and stores it in the existing MongoDB database
(`AmiBotVoiceProfile`, ID `amibot`). This survives free Render restarts; no upload
disk, Python process, voice API key, or additional Render service is required.
Replacement is authenticated and admin-only. A missing recording is reported as
an incomplete owner setup, rather than a disconnected voice service.

**The reference is public.** Visitors must download it to generate the voice.
People can save their own copies. Legacy private worker recordings are never
automatically published. An actual owner recording must be saved with both
consents; no demo voice is shipped as the owner's voice.

## Visitor behavior and limits

- Explicit download acknowledgement before loading models (about 1.6–1.9 GB initially).
  Browser caching avoids repeat downloads when storage permits; clearing storage
  or browser eviction requires another download. Model files come from Hugging Face;
  ONNX WASM runtime files come from the versioned Transformers.js CDN dependency.
- Weight downloads recover from stalled transfers after 45 seconds without data,
  with up to two retries from the received byte offset. A resumed response must
  match the expected range and file identity; mismatches fail safely. Only complete
  files are cached. Progress includes aggregate percentages and recovery notices.
- Turbo uses a 4-bit language model, with an fp16 voice encoder where supported
  and an fp32 waveform decoder. Reduced-precision waveform decoders lost words in
  real browser tests, so the decoder stays fp32 on all devices. Repetition penalties
  apply only to generated speech tokens, not unrelated text-token IDs. The old model's exaggeration selector is removed because
  Turbo does not support that control; the saved owner recording still defines the voice.
  Existing visitors need to download the new model files once.
- Recognition uses Whisper base.en on WebGPU when available (fp32 encoder and q4
  decoder, about 206 MB). CPU fallback uses q8 weights (about 77 MB). A short silent
  warm-up during setup prepares recognition before the microphone opens. Failed GPU
  recognition initialization or warm-up falls back to CPU and releases the failed session.
  Recognition remains local and English-only. A silent speech-generation warm-up
  also completes before microphone capture, once per worker, to prepare the first reply.
- English only. A recent desktop Chrome/Edge with enough free memory is preferred.
  WebGPU is used when available, otherwise CPU/WASM. Weak devices can be too slow
  or run out of memory. This is turn-based speech, not guaranteed real-time audio.
- Microphone audio and generated speech remain on the device. Transcribed text is
  sent to the existing AmiBot API and follows its existing history rules.
- Turns stop after a short pause, **Send now**, or 55 seconds. The microphone pauses
  during replies. Interrupt cancels queued speech and resumes listening.
- Replies start with a short opening sentence or phrase, capped at 32 characters
  on both WebGPU and CPU, while later chunks of up to 160 characters prepare during
  playback. The complete answer is preserved, including names such as Node.js.
- Voice answers normally use 10-50 words. The backend disables optional thinking
  for Gemini 2.5 Flash voice requests and limits output to 384 tokens; other models
  and ordinary chat retain their existing generation settings. Knowledge grounding
  and fallback behavior are unchanged.
- Voice mode displays the time from the last detected user speech to first reply
  playback, including silence detection, transcription, the answer API, and speech
  generation. The target is to start within 30 seconds after setup; download, model
  initialization, slow devices, and a sleeping free backend can take longer.
- Recently generated speech is reused within the open voice session, bounded to
  12 chunks / 8 MB in memory. Replacing the reference clears the cache; closing the
  worker clears it too. Nothing is written to persistent storage for this cache.
- Recoverable chat or microphone errors keep successfully loaded models available
  for retry, instead of forcing another model download and initialization.
- The orb/waveform follow measured input and playback amplitude. Downloading,
  transcribing, thinking, preparing, speaking, and paused states are distinct.
- End cancels active work; closing the panel also releases the model worker.
  Switching tabs preserves a model download but stops microphone capture. If setup
  completes in the background, return and start the conversation to enable the mic.
  No browser/system voice substitutes
  for the owner's recording if inference fails.

## Verification

Run `npm.cmd test -- --watchAll=false --runInBand src/components/AmiBot` and
`npm.cmd exec react-scripts build`. The backend has `test/amibotBrowserVoice.test.js`
for upload authorization, both consents, WAV boundaries, storage round trip, public
status/reference behavior, and safe database errors. A browser/device inference
check and listening comparison with the owner's actual recording are also needed;
mocked unit tests cannot establish voice similarity or latency.

A local Chrome/WebGPU check using the model's public demo recording verified both
"Hello. Welcome to AmiVerse." and "I can help you explore my projects." by transcribing
the generated audio. Warm generation took about 6 seconds for a 2-second phrase;
recognition took about 1.6 seconds on the test computer. These are device-specific
measurements, not a real-time guarantee or an owner-voice listening evaluation.

On 2026-10-16, the production browser worker and live Render answer API were tested
with requests for about 10, 25, and 50 words. The API returned 12, 24, and 34 words.
With a 32-character opening limit, reply playback started in **21.78, 21.74, and
22.47 seconds**. These totals include real Whisper recognition, the live knowledge
answer, uncached first-chunk synthesis, and the 1.05-second end-of-speech pause
(simulated; no live microphone capture). Chrome used WebGPU and the public demo
reference after model setup. Each generated opening was successfully transcribed
back to its requested words. API time was 2.97-4.37 seconds and synthesis time was
14.66-15.27 seconds. This validates the measured short-turn path on this computer,
not a universal deadline for CPU devices, backend cold starts, or initial setup.

Model source: https://huggingface.co/ResembleAI/chatterbox-turbo-ONNX

The optional Python worker remains available for a future separately hosted mode.
Its Render Blueprint is a paid example and is **not used by browser voice mode**.
