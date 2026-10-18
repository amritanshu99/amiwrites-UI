/* eslint-env worker */
/* global globalThis, BigInt64Array, BigInt */
// Adapted from KevinAHM/pocket-tts-web, revision d0c0c79b7712256a32d691c67f20b8ae2e020d00.
// Apache-2.0. See public/voice/NOTICE.txt and CODE-LICENSE.txt.
// Model: Kyutai Pocket TTS (CC BY 4.0). Only the owner's custom voice is used.
import { fetchPocketAsset } from "./pocketVoiceAssets";
import { spokenTechnicalTerms } from "./pocketVoiceText";
let reportProgress, onAudio, isCanceled = () => false;
const fetchAsset = (url) => fetchPocketAsset(url, reportProgress);
const createSession = async (language, name, options) => ort.InferenceSession.create(
    await (await fetchAsset(bundlePath(language, name))).arrayBuffer(), options);
function emit(message) {
    if (message.type === "audio_chunk") onAudio?.(message.data);
    else if (message.type === "status" && !onAudio) reportProgress?.({ message: message.status });
}
// Pocket TTS ONNX Web Worker



let ort = null;

const DEFAULT_LANGUAGE = "english_2026-04";
const LANGUAGE_BUNDLES = ["english_2026-04", "german", "italian", "portuguese", "spanish"];
const MODEL_STEMS = {
    mimi_encoder: "mimi_encoder_int8.onnx",
    text_conditioner: "text_conditioner_int8.onnx",
    flow_lm_main: "flow_lm_main_int8.onnx",
    flow_lm_flow: "flow_lm_flow_int8.onnx",
    mimi_decoder: "mimi_decoder_int8.onnx",
};
const DEBUG_LOGS = false;
const CHUNK_GAP_SEC = 0.25;
const MAX_FRAMES = 500;
const LSD_STEPS = 1;
const RESET_FLOW_STATE_EACH_CHUNK = true;
const RESET_MIMI_STATE_EACH_CHUNK = true;



let bundleMetadata = null;
let tokenizerProcessor = null;
let tokenizerModelB64 = null;
let bosBeforeVoice = null;

let mimiEncoderSession = null;
let textConditionerSession = null;
let flowLmMainSession = null;
let flowLmFlowSession = null;
let mimiDecoderSession = null;

let currentSampleRate = 24000;
let currentSamplesPerFrame = 1920;
let currentLatentDim = 32;
let currentConditioningDim = 1024;
let currentMaxTokenPerChunk = 50;


let customVoiceEmbedding = null;

let voiceConditioningCache = new Map();

let stTensors = [];



function bundleDir(language) {
    return `https://huggingface.co/spaces/KevinAHM/pocket-tts-web/resolve/d0c0c79b7712256a32d691c67f20b8ae2e020d00/onnx/${language}`;
}

function bundlePath(language, filename) {
    return `${bundleDir(language)}/${filename}`;
}

function debugLog(...args) {
    if (DEBUG_LOGS) {
        console.log(...args);
    }
}

function makeFilledArray(shape, dtype, fill) {
    const size = shape.reduce((a, b) => a * b, 1);
    let data;

    if (dtype === "int64") {
        data = new BigInt64Array(size);
    } else if (dtype === "bool") {
        data = new Uint8Array(size);
    } else {
        data = new Float32Array(size);
        if (fill === "nan") {
            data.fill(NaN);
        } else if (fill === "ones") {
            data.fill(1);
        }
    }

    return data;
}

function createTensor(dtype, data, dims) {
    return new ort.Tensor(dtype, data, dims);
}

function initStateFromManifest(manifest) {
    const state = {};
    for (const entry of manifest) {
        state[entry.input_name] = createTensor(
            entry.dtype,
            makeFilledArray(entry.shape, entry.dtype, entry.fill),
            entry.shape
        );
    }
    return state;
}

function cloneState(state) {
    return { ...state };
}

function updateStateFromManifestOutputs(state, result, manifest) {
    for (const entry of manifest) {
        state[entry.input_name] = result[entry.output_name];
    }
}

function prepareVoiceEmbeddingData(voiceEmb) {
    let data = voiceEmb.data;
    let dims = voiceEmb.shape.slice();

    if (bundleMetadata.insert_bos_before_voice && bosBeforeVoice) {
        const bosData = bosBeforeVoice.data;
        const combined = new Float32Array(bosData.length + data.length);
        combined.set(bosData, 0);
        combined.set(data, bosData.length);
        data = combined;
        dims = [1, dims[1] + bosBeforeVoice.shape[1], dims[2]];
    }

    return createTensor("float32", data, dims);
}

async function buildVoiceConditionedState(voiceEmb) {
    const flowLmState = initStateFromManifest(bundleMetadata.flow_lm_state_manifest);
    const emptySeq = createTensor("float32", new Float32Array(0), [1, 0, currentLatentDim]);
    const voiceTensor = prepareVoiceEmbeddingData(voiceEmb);

    const result = await flowLmMainSession.run({
        sequence: emptySeq,
        text_embeddings: voiceTensor,
        ...flowLmState,
    });

    updateStateFromManifestOutputs(flowLmState, result, bundleMetadata.flow_lm_state_manifest);
    return flowLmState;
}

async function ensureCustomVoiceCached(options = {}) {
    const { force = false, statusText = "Preparing custom voice..." } = options;
    if (!customVoiceEmbedding) {
        throw new Error("No custom voice loaded.");
    }

    if (!force && voiceConditioningCache.has("custom")) {
        return voiceConditioningCache.get("custom");
    }

    emit({ type: "status", status: statusText, state: "loading" });
    const conditioned = await buildVoiceConditionedState(customVoiceEmbedding);
    voiceConditioningCache.set("custom", conditioned);
    return conditioned;
}

function parseNpyFloat32(buffer) {
    const view = new DataView(buffer);
    const magic = new Uint8Array(buffer, 0, 6);
    const expected = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59];
    for (let i = 0; i < expected.length; i++) {
        if (magic[i] !== expected[i]) {
            throw new Error("Invalid NPY file");
        }
    }

    const major = view.getUint8(6);
    const headerLen = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
    const headerOffset = major === 1 ? 10 : 12;
    const headerText = new TextDecoder().decode(new Uint8Array(buffer, headerOffset, headerLen));
    const shapeMatch = headerText.match(/\(\s*([0-9,\s]+)\)/);
    if (!shapeMatch) {
        throw new Error("Could not parse NPY shape");
    }
    const shape = shapeMatch[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => Number.parseInt(part, 10));
    const dataOffset = headerOffset + headerLen;
    const data = new Float32Array(buffer, dataOffset);
    return { data: new Float32Array(data), shape };
}

async function encodeVoiceAudio(audioData) {
    const input = createTensor("float32", audioData, [1, 1, audioData.length]);
    const outputs = await mimiEncoderSession.run({ audio: input });
    const embeddings = outputs[mimiEncoderSession.outputNames[0]];

    let dims = embeddings.dims.slice();
    let data = new Float32Array(embeddings.data);
    while (dims.length > 3) {
        if (dims[0] !== 1) break;
        dims = dims.slice(1);
    }
    if (dims.length < 3) {
        dims = [1, dims[0], dims[1]];
    }

    return { data, shape: dims };
}

function prepareTextPrompt(text) {
    let prompt = text.trim();
    if (!prompt) {
        return { text: "", framesAfterEos: 1 };
    }

    prompt = spokenTechnicalTerms(prompt.replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " "));
    if (bundleMetadata.remove_semicolons) {
        prompt = prompt.replace(/;/g, ",");
    }

    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    let framesAfterEos = wordCount <= 4 ? 3 : 1;
    if (bundleMetadata.model_recommended_frames_after_eos != null) {
        framesAfterEos = Number(bundleMetadata.model_recommended_frames_after_eos);
    }

    if (prompt && !/[A-ZÀ-Þ]/.test(prompt[0])) {
        prompt = prompt[0].toUpperCase() + prompt.slice(1);
    }
    if (prompt && /[0-9A-Za-zÀ-ÿ]/.test(prompt[prompt.length - 1])) {
        prompt += ".";
    }
    if (bundleMetadata.pad_with_spaces_for_short_inputs && wordCount < 5) {
        prompt = "        " + prompt;
    }

    return { text: prompt, framesAfterEos };
}

const SENTENCE_SPLIT_RE = /.+?(?:[.!?]+(?=\s|$)|$)/g;

function splitTextIntoSentences(text) {
    const matches = text.match(SENTENCE_SPLIT_RE);
    if (!matches) return [];
    return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function splitLongSentence(text, maxTokens) {
    const chunks = [];
    let current = "";
    // Keep whole words intact. Splitting token IDs can cut a word in half and
    // make the model mispronounce both pieces at the next sentence boundary.
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const combined = current ? `${current} ${word}` : word;
        if (current && tokenizerProcessor.encodeIds(combined).length > maxTokens) {
            chunks.push(current);
            current = word;
        } else current = combined;
    }
    if (current) chunks.push(current);
    return chunks;
}

function splitIntoBestSentences(text) {
    const prepared = prepareTextPrompt(text);
    if (!prepared.text) {
        return { chunks: [], framesAfterEos: prepared.framesAfterEos };
    }

    const sentences = splitTextIntoSentences(prepared.text);
    if (!sentences.length) {
        return { chunks: [prepared.text], framesAfterEos: prepared.framesAfterEos };
    }

    const chunks = [];
    let currentChunk = "";

    for (const sentenceText of sentences) {
        const sentenceTokenIds = tokenizerProcessor.encodeIds(sentenceText);
        const sentenceTokens = sentenceTokenIds.length;

        if (sentenceTokens > currentMaxTokenPerChunk) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }
            const splitChunks = splitLongSentence(sentenceText, currentMaxTokenPerChunk);
            for (const splitChunk of splitChunks) {
                if (splitChunk) {
                    chunks.push(splitChunk.trim());
                }
            }
            continue;
        }

        if (!currentChunk) {
            currentChunk = sentenceText;
            continue;
        }

        const combined = `${currentChunk} ${sentenceText}`;
        const combinedTokens = tokenizerProcessor.encodeIds(combined).length;
        if (combinedTokens > currentMaxTokenPerChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentenceText;
        } else {
            currentChunk = combined;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return { chunks, framesAfterEos: prepared.framesAfterEos };
}

function precomputeFlowBuffers() {
    stTensors = [];
    const dt = 1.0 / LSD_STEPS;
    for (let step = 0; step < LSD_STEPS; step++) {
        const s = step / LSD_STEPS;
        const t = s + dt;
        stTensors.push({
            s: createTensor("float32", new Float32Array([s]), [1, 1]),
            t: createTensor("float32", new Float32Array([t]), [1, 1]),
        });
    }
}

async function loadOrt() {
    if (ort) {
        return;
    }

    emit({ type: "status", status: "Loading ONNX Runtime...", state: "loading" });
    const version = "1.20.0";
    const cdnBase = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`;
    const ortModule = await import(/* webpackIgnore: true */ `${cdnBase}ort.min.mjs`);
    ort = ortModule.default || ortModule;
    ort.env.wasm.wasmPaths = cdnBase;
    ort.env.wasm.simd = true;
    ort.env.wasm.numThreads = globalThis.crossOriginIsolated
        ? Math.min(navigator.hardwareConcurrency || 4, 4)
        : 1;
    precomputeFlowBuffers();
}

async function releaseSession(session) {
    if (!session) {
        return;
    }
    if (typeof session.release === "function") {
        await session.release();
    }
}

async function loadBundle(language) {
    if (!LANGUAGE_BUNDLES.includes(language)) {
        throw new Error(`Unsupported language bundle: ${language}`);
    }

    await loadOrt();

    emit({ type: "status", status: `Loading ${language} bundle...`, state: "loading" });


    const metadataResponse = await fetchAsset(bundlePath(language, "bundle.json"));
    if (!metadataResponse.ok) {
        throw new Error(`Failed to load bundle metadata for ${language}`);
    }
    bundleMetadata = await metadataResponse.json();

    currentSampleRate = Number(bundleMetadata.sample_rate);
    currentSamplesPerFrame = Number(bundleMetadata.samples_per_frame);
    currentLatentDim = Number(bundleMetadata.latent_dim);
    currentConditioningDim = Number(bundleMetadata.conditioning_dim);
    currentMaxTokenPerChunk = Number(bundleMetadata.max_token_per_chunk || 50);


    await Promise.all([
        releaseSession(mimiEncoderSession),
        releaseSession(textConditionerSession),
        releaseSession(flowLmMainSession),
        releaseSession(flowLmFlowSession),
        releaseSession(mimiDecoderSession),
    ]);

    const sessionOptions = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
    };

    const [encoderRes, textCondRes, flowMainRes, flowFlowRes, decoderRes] = await Promise.all([
        createSession(language, MODEL_STEMS.mimi_encoder, sessionOptions),
        createSession(language, MODEL_STEMS.text_conditioner, sessionOptions),
        createSession(language, MODEL_STEMS.flow_lm_main, sessionOptions),
        createSession(language, MODEL_STEMS.flow_lm_flow, sessionOptions),
        createSession(language, MODEL_STEMS.mimi_decoder, sessionOptions),
    ]);

    mimiEncoderSession = encoderRes;
    textConditionerSession = textCondRes;
    flowLmMainSession = flowMainRes;
    flowLmFlowSession = flowFlowRes;
    mimiDecoderSession = decoderRes;

    const tokenizerResponse = await fetchAsset(bundlePath(language, bundleMetadata.tokenizer_file));
    if (!tokenizerResponse.ok) {
        throw new Error(`Failed to load tokenizer for ${language}`);
    }
    const tokenizerBuffer = await tokenizerResponse.arrayBuffer();
    tokenizerModelB64 = btoa(String.fromCharCode(...new Uint8Array(tokenizerBuffer)));
    const spModule = await import(/* webpackIgnore: true */ new URL("/voice/sentencepiece.js", globalThis.location.origin).href);
    tokenizerProcessor = new spModule.SentencePieceProcessor();
    await tokenizerProcessor.loadFromB64StringModel(tokenizerModelB64);

    bosBeforeVoice = null;
    if (bundleMetadata.bos_before_voice_file) {
        const bosResponse = await fetchAsset(bundlePath(language, bundleMetadata.bos_before_voice_file));
        if (bosResponse.ok) {
            bosBeforeVoice = parseNpyFloat32(await bosResponse.arrayBuffer());
        }
    }

    voiceConditioningCache = new Map();
    emit({ type: "status", status: "Voice model ready", state: "idle" });
}

async function runGenerationPipeline(voiceName, chunks, framesAfterEos) {
    let mimiState = initStateFromManifest(bundleMetadata.mimi_state_manifest);
    const emptySeq = createTensor("float32", new Float32Array(0), [1, 0, currentLatentDim]);
    const emptyTextEmb = createTensor("float32", new Float32Array(0), [1, 0, currentConditioningDim]);
    const baseFlowState = voiceConditioningCache.get(voiceName);
    if (!baseFlowState) {
        throw new Error(`Voice conditioning cache missing for '${voiceName}'.`);
    }
    let flowLmState = cloneState(baseFlowState);

    const firstChunkFrames = 12;
    const normalChunkFrames = 12;
    const allGeneratedLatents = [];
    let isFirstAudioChunk = true;
    let totalFlowLmTime = 0;
    let totalDecodeTime = 0;
    const generationStart = performance.now();

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        if (isCanceled()) throw new DOMException("Voice generation canceled", "AbortError");

        if (RESET_FLOW_STATE_EACH_CHUNK && chunkIdx > 0) {
            flowLmState = cloneState(baseFlowState);
        }
        if (RESET_MIMI_STATE_EACH_CHUNK && chunkIdx > 0) {
            mimiState = initStateFromManifest(bundleMetadata.mimi_state_manifest);
        }

        const chunkText = chunks[chunkIdx];
        let isFirstAudioChunkOfTextChunk = true;
        const tokenIds = tokenizerProcessor.encodeIds(chunkText);
        const textInput = createTensor(
            "int64",
            BigInt64Array.from(tokenIds.map((token) => BigInt(token))),
            [1, tokenIds.length]
        );

        let textEmb = (await textConditionerSession.run({ token_ids: textInput }))[textConditionerSession.outputNames[0]];
        if (textEmb.dims.length === 2) {
            textEmb = createTensor("float32", new Float32Array(textEmb.data), [1, textEmb.dims[0], textEmb.dims[1]]);
        }

        const condResult = await flowLmMainSession.run({
            sequence: emptySeq,
            text_embeddings: textEmb,
            ...flowLmState,
        });
        updateStateFromManifestOutputs(flowLmState, condResult, bundleMetadata.flow_lm_state_manifest);

        const chunkLatents = [];
        let chunkDecodedFrames = 0;
        let currentLatent = createTensor("float32", new Float32Array(currentLatentDim).fill(NaN), [1, 1, currentLatentDim]);
        let eosStep = null;
        let chunkEnded = false;
        let chunkGenTimeMs = 0;

        for (let step = 0; step < MAX_FRAMES; step++) {
            if (isCanceled()) throw new DOMException("Voice generation canceled", "AbortError");
            if (step > 0 && step % 4 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            const stepStart = performance.now();
            const arResult = await flowLmMainSession.run({
                sequence: currentLatent,
                text_embeddings: emptyTextEmb,
                ...flowLmState,
            });
            const stepElapsed = performance.now() - stepStart;
            chunkGenTimeMs += stepElapsed;
            totalFlowLmTime += stepElapsed;

            const conditioning = arResult.conditioning;
            const eosLogit = arResult.eos_logit.data[0];
            const isEos = eosLogit > -4.0;
            if (isEos && eosStep == null) {
                eosStep = step;
            }
            const shouldStop = eosStep != null && step >= eosStep + framesAfterEos;

            // Kyutai's english_2026-04 config recommends 0.3. The community
            // demo's 0.7 default causes more variation with this owner's sample.
            const temperature = 0.3;
            const std = Math.sqrt(temperature);
            const latentData = new Float32Array(currentLatentDim);
            for (let i = 0; i < currentLatentDim; i++) {
                let u = 0;
                let v = 0;
                while (u === 0) u = Math.random();
                while (v === 0) v = Math.random();
                latentData[i] = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
            }

            const dt = 1.0 / LSD_STEPS;
            for (let lsdIndex = 0; lsdIndex < LSD_STEPS; lsdIndex++) {
                const flowResult = await flowLmFlowSession.run({
                    c: conditioning,
                    s: stTensors[lsdIndex].s,
                    t: stTensors[lsdIndex].t,
                    x: createTensor("float32", latentData, [1, currentLatentDim]),
                });
                const flowDir = flowResult.flow_dir.data;
                for (let i = 0; i < currentLatentDim; i++) {
                    latentData[i] += flowDir[i] * dt;
                }
            }

            chunkLatents.push(new Float32Array(latentData));
            allGeneratedLatents.push(new Float32Array(latentData));
            currentLatent = createTensor("float32", latentData, [1, 1, currentLatentDim]);
            updateStateFromManifestOutputs(flowLmState, arResult, bundleMetadata.flow_lm_state_manifest);

            const pending = chunkLatents.length - chunkDecodedFrames;
            let decodeSize = 0;
            if (shouldStop) {
                decodeSize = pending;
            } else if (isFirstAudioChunk && pending >= firstChunkFrames) {
                decodeSize = firstChunkFrames;
            } else if (pending >= normalChunkFrames) {
                decodeSize = normalChunkFrames;
            }

            if (decodeSize > 0) {
                const decodeLatents = new Float32Array(decodeSize * currentLatentDim);
                for (let frame = 0; frame < decodeSize; frame++) {
                    decodeLatents.set(chunkLatents[chunkDecodedFrames + frame], frame * currentLatentDim);
                }

                const decoderStart = performance.now();
                const decodeResult = await mimiDecoderSession.run({
                    latent: createTensor("float32", decodeLatents, [1, decodeSize, currentLatentDim]),
                    ...mimiState,
                });
                const decoderElapsed = performance.now() - decoderStart;
                chunkGenTimeMs += decoderElapsed;
                totalDecodeTime += decoderElapsed;

                for (const entry of bundleMetadata.mimi_state_manifest) {
                    mimiState[entry.input_name] = decodeResult[entry.output_name];
                }

                chunkDecodedFrames += decodeSize;
                const audioFloat32 = new Float32Array(decodeResult[mimiDecoderSession.outputNames[0]].data);
                const isLastChunk = shouldStop && chunkIdx === chunks.length - 1;

                emit({
                    type: "audio_chunk",
                    data: audioFloat32,
                    metrics: {
                        bbTime: 0,
                        decTime: 0,
                        chunkDuration: audioFloat32.length / currentSampleRate,
                        genTimeSec: chunkGenTimeMs / 1000,
                        isFirst: isFirstAudioChunk,
                        isLast: isLastChunk,
                        chunkStart: isFirstAudioChunkOfTextChunk,
                    },
                }, [audioFloat32.buffer]);

                isFirstAudioChunk = false;
                isFirstAudioChunkOfTextChunk = false;
                chunkGenTimeMs = 0;
            }

            if (shouldStop) {
                chunkEnded = true;
                break;
            }
        }

        if (!chunkEnded) throw new Error("The voice model could not finish this sentence. Please try a shorter reply.");
        if (chunkIdx < chunks.length - 1) {
            const gapSamples = Math.max(1, Math.floor(CHUNK_GAP_SEC * currentSampleRate));
            const silence = new Float32Array(gapSamples);
            emit({
                type: "audio_chunk",
                data: silence,
                metrics: {
                    bbTime: 0,
                    decTime: 0,
                    chunkDuration: gapSamples / currentSampleRate,
                    isFirst: false,
                    isLast: false,
                    isSilence: true,
                },
            }, [silence.buffer]);
        }
    }

    const totalTime = (performance.now() - generationStart) / 1000;
    const audioSeconds = allGeneratedLatents.length * currentSamplesPerFrame / currentSampleRate;
    const genTime = (totalFlowLmTime + totalDecodeTime) / 1000;
    const rtfx = genTime > 0 ? audioSeconds / genTime : 0;

    debugLog(`Generation complete for ${voiceName} in ${totalTime.toFixed(2)}s (RTFx ${rtfx.toFixed(2)}x)`);
    emit({
        type: "status",
        status: `Finished (RTFx: ${rtfx.toFixed(2)}x)`,
        state: "idle",
        metrics: { rtfx, genTime, totalTime, audioDuration: audioSeconds },
    });
}

const pocketVoice = {
    async load(progress) {
        reportProgress = progress;
        if (!mimiEncoderSession) await loadBundle(DEFAULT_LANGUAGE);
        return { device: globalThis.crossOriginIsolated ? "wasm-threads" : "wasm" };
    },
    async setReference(audio) {
        // The Mimi encoder needs a bounded prompt; long recordings can exceed WASM memory.
        // Preserve the saved recording and encode its first ten seconds locally.
        customVoiceEmbedding = await encodeVoiceAudio(audio.slice(0, 240000));
        for (const state of voiceConditioningCache.values()) for (const tensor of Object.values(state)) tensor.dispose?.();
        voiceConditioningCache.clear();
        await ensureCustomVoiceCached({ force: true });
    },
    async generate(text, { onChunk, canceled = () => false } = {}) {
        if (!customVoiceEmbedding) throw new Error("AmiBot's voice reference is missing.");
        const prepared = splitIntoBestSentences(text);
        if (!prepared.chunks.length) throw new Error("There is no spoken text in this reply.");
        const chunks = [];
        onAudio = (audio) => { chunks.push(audio); onChunk?.(audio.slice()); };
        isCanceled = canceled;
        try {
            await runGenerationPipeline("custom", prepared.chunks, prepared.framesAfterEos);
            if (canceled()) throw new DOMException("Voice generation canceled", "AbortError");
            const audio = new Float32Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) { audio.set(chunk, offset); offset += chunk.length; }
            return audio;
        } finally { onAudio = null; isCanceled = () => false; }
    },
};
export default pocketVoice;
