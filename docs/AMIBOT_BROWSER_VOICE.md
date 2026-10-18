# AmiBot browser voice

AmiBot uses Pocket TTS for the owner's cloned voice and Whisper base.en for
speech recognition. Both run in a Web Worker on the visitor's device. The existing
AmiBot text API answers questions with its knowledge and history. No paid voice
API, Python host, GPU server, or additional Render service is required. The text
API retains its existing provider and any existing costs.

## Owner setup

1. Deploy the backend browser-voice routes and this frontend.
2. Sign in as admin and open `/amibot-admin` (Ami Pulse).
3. Under **Your voice, in AmiBot**, record or upload 5–30 seconds of clear English.
   Speak naturally from the beginning; the first ten seconds provide the voice sample.
4. Preview the recording and confirm ownership and public reference sharing.
5. Save the voice and open AmiBot's microphone button.

Existing saved recordings continue to work. The original recording is preserved;
only the local encoder input is capped at ten seconds to bound WASM memory use.
The backend validates and stores mono 24 kHz PCM16 WAV in the existing MongoDB
`AmiBotVoiceProfile` document. It survives free Render restarts. Replacement remains
authenticated and admin-only. Missing recordings are reported as incomplete setup.

**The reference is public.** Visitors need it to generate the voice and can save
their own copies. Both owner consents are required. Private legacy worker recordings
are never published automatically. No demo or device voice replaces the owner voice.

## Deployment and runtime

- Voice opens with a full navigation to `/amibot/voice`. That document receives
  `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp`. Static worker assets also receive COEP.
  This enables up to four WASM threads for Pocket TTS. Check the live response headers
  and the worker's `wasm-threads` result after deployment; a dev server without these
  headers runs a slower single-thread fallback.
- Ordinary pages keep their existing popup-compatible policy. The isolated voice
  page has a focused layout without the sign-in header. **Back to chat** navigates
  back to the normal document. Signed-in history remains on the server. Guest context
  crosses navigation in tab-local session storage (last 24 messages, five-minute
  expiry), then is removed on arrival.
- Explicit acknowledgement precedes any model downloads. Pocket weights total about
  146 MB. Whisper uses about 206 MB on WebGPU or 77 MB for CPU fallback, giving roughly
  230–360 MB of model downloads. Runtime/tokenizer assets add a few more MB.
  Browser caching avoids repeat downloads when storage permits. Existing Chatterbox
  users need the new files once; this release does not erase their other cached data.
- Pocket's ONNX bundle is pinned to KevinAHM/pocket-tts-web revision
  `d0c0c79b7712256a32d691c67f20b8ae2e020d00`, `english_2026-04`.
  ONNX Runtime Web is pinned to 1.20.0. The bundled SentencePiece tokenizer comes
  from that same revision. Built-in voice embeddings are neither downloaded nor used.
- Model downloads resume after 45 seconds without data, with at most two retries.
  Range and file identity must match. Pocket weight byte counts are validated before
  caching. Storage denial or quota failure permits memory-only loading.
- Whisper uses Transformers.js 4.3.1, fp32 encoder/q4 decoder on WebGPU or q8 CPU
  fallback. GPU initialization or warm-up failures release the failed recognizer and
  retry on CPU. Silent recognition and cloned-speech warm-ups finish before the mic opens.

## Conversation and playback

- English only. A recent desktop Chrome/Edge is preferred. Speech is generated with
  the saved owner sample; this is a synthetic approximation, not an identical recording.
- The mic stops after a short pause, **Send now**, or 55 seconds and pauses during
  replies. Microphone audio and generated speech remain local. Only transcribed text
  goes to the existing AmiBot API under its existing history rules.
- Simple voice answers normally use 10–20 words; detail requests can use up to 50.
  The backend disables optional thinking for Gemini 2.5 Flash voice requests and
  bounds output tokens. The client preserves the complete answer without word truncation.
- PCM streams from the worker. Playback waits for a lead based on measured generation
  speed and estimated reply duration, then schedules chunks on one Web Audio clock.
  This overlaps generation with playback while reducing buffer underruns. It does not
  restart the voice for a tiny opening phrase or insert a fade at every PCM boundary.
  Text requests are bounded to 500 characters; model chunks preserve whole words and
  sentence boundaries where possible, including names such as Node.js.
- The orb and waveform use measured microphone/playback amplitude. Loading,
  transcribing, thinking, preparing, speaking, and paused states are distinct.
  Response timing includes silence detection, recognition, API time, and initial buffering.
- Interrupt and mute cancel inference, stop every scheduled audio source, and discard
  late chunks. The loaded worker can process the next turn. End stops capture/playback;
  leaving voice mode also releases the model worker. Switching tabs stops the mic but
  lets downloads continue. No mic opens automatically after setup in a hidden tab.
- Repeated speech uses a session-only cache bounded to 12 entries / 8 MB. Changing the
  reference clears it. Recoverable API/microphone failures keep loaded models for retry.

The goal is to start speaking within 30 seconds after setup. It is not a guarantee:
first downloads, slow devices, single-thread fallback, competing CPU work, and a
sleeping free backend can take longer. Continuous playback also depends on the device
maintaining its measured generation speed.

## Verification

Run the AmiBot unit tests and production build. Tests cover stalled/ranged downloads,
cache failures, streaming, cancellation, audio scheduling, navigation context, worker
fallbacks, microphone lifecycle, and the chat API integration. The backend tests cover
upload authorization, consents, WAV validation, storage round trips, and public status.

A release check must also run the production worker with the actual saved owner
recording, generate full short and 50-word replies, measure first scheduled playback,
check for scheduling gaps, and transcribe the complete generated speech. Test the live
answer API and interruption followed by another reply. Mocked tests cannot establish
latency or voice similarity; transcription checks words, not resemblance to the owner.

The October 18, 2026 Chrome laptop check used the production worker, four WASM
threads, GPU recognition, and the saved 28.02-second owner recording (ten seconds
encoded locally). After setup, live 12- and 21-word answers began in 17.71 and
23.72 seconds, including recognition, API time, and a 1.05-second end-of-speech pause.
A fixed 50-word answer began after 23.30 seconds of synthesis/buffering, while full
generation took 31.47 seconds; that fixed-text timing excludes the answer API and
recognition. All five measured replies had zero scheduling gaps. Interruption was
followed successfully by a new reply in the same worker. Proper names and some
technical terms differed in automatic transcription; this is not a claim of perfect
pronunciation or a listening assessment of voice similarity.

Model/source credits and licenses are linked from the voice page at `/voice/NOTICE.txt`.
The optional Python worker remains available for separately hosted use; its paid Render
Blueprint is not used by browser voice mode.
