# AmiBot browser voice

AmiBot uses Chatterbox ONNX for the owner's cloned voice and Whisper tiny.en for
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

- Explicit download acknowledgement before loading models (about 1.6 GB initially).
  Browser caching avoids repeat downloads when storage permits; clearing storage
  or browser eviction requires another download. Model files come from Hugging Face;
  ONNX WASM runtime files come from the versioned Transformers.js CDN dependency.
- English only. A recent desktop Chrome/Edge with enough free memory is preferred.
  WebGPU is used when available, otherwise CPU/WASM. Weak devices can be too slow
  or run out of memory. This is turn-based speech, not guaranteed real-time audio.
- Microphone audio and generated speech remain on the device. Transcribed text is
  sent to the existing AmiBot API and follows its existing history rules.
- Turns stop after a short pause, **Send now**, or 55 seconds. The microphone pauses
  during replies. Interrupt cancels queued speech and resumes listening.
- The orb/waveform follow measured input and playback amplitude. Downloading,
  transcribing, thinking, preparing, speaking, and paused states are distinct.
- End cancels active work; closing the panel also releases the model worker.
  Hiding the page stops microphone capture. No browser/system voice substitutes
  for the owner's recording if inference fails.

## Verification

Run `npm.cmd test -- --watchAll=false --runInBand src/components/AmiBot` and
`npm.cmd exec react-scripts build`. The backend has `test/amibotBrowserVoice.test.js`
for upload authorization, both consents, WAV boundaries, storage round trip, public
status/reference behavior, and safe database errors. A browser/device inference
check and listening comparison with the owner's actual recording are also needed;
mocked unit tests cannot establish voice similarity or latency.

The optional Python worker remains available for a future separately hosted mode.
Its Render Blueprint is a paid example and is **not used by browser voice mode**.
