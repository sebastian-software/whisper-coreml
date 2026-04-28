# whisper-coreml

<p align="center">
  <img src="logo.svg" alt="whisper-coreml" width="128" height="128">
</p>

<p align="center">
  <strong>Best-in-class speech recognition for Node.js on Apple Silicon</strong>
</p>

<p align="center">
  <a href="https://oss.sebastian-software.com"><img src="https://img.shields.io/badge/Powered%20by-Sebastian%20Software-00718d?style=flat-square" alt="Powered by Sebastian Software"></a>
  <a href="https://github.com/sebastian-software/whisper-coreml/actions/workflows/ci.yml"><img src="https://github.com/sebastian-software/whisper-coreml/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/whisper-coreml"><img src="https://img.shields.io/npm/v/whisper-coreml.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/whisper-coreml"><img src="https://img.shields.io/npm/dm/whisper-coreml.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/sebastian-software/whisper-coreml"><img src="https://codecov.io/gh/sebastian-software/whisper-coreml/branch/main/graph/badge.svg" alt="codecov"></a>
  <br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

**Transcribe audio in 99 languages. Run 100% offline on your Mac.**

OpenAI's Whisper is the gold standard for speech recognition accuracy. This package brings it to
Node.js – powered by Apple's Neural Engine for fast, private, local transcription.

## The Pitch

🎯 **Accuracy first.** Whisper large-v3-turbo delivers state-of-the-art transcription quality –
better than any cloud API, right on your Mac.

🌍 **99 languages.** From Afrikaans to Zulu. Handles accents, dialects, and background noise.

🔒 **100% private.** Your audio never leaves your device. No API keys. No cloud. No subscription.

⚡ **Fast enough.** 14x real-time on M1 Ultra – transcribe 1 hour of audio in under 5 minutes.

## Why CoreML?

Running Whisper without hardware acceleration is **painfully slow**. Here's how the alternatives
compare:

| Approach                | Speed             | Drawbacks                   |
| ----------------------- | ----------------- | --------------------------- |
| OpenAI Whisper (Python) | ~2x real-time     | Slow, needs Python          |
| whisper.cpp (CPU)       | ~4x real-time     | No acceleration             |
| faster-whisper          | ~6x real-time     | Needs NVIDIA GPU            |
| Cloud APIs              | ~1x + latency     | Costs $$$, privacy concerns |
| **whisper-coreml**      | **14x real-time** | macOS only ✓                |

The Neural Engine in every Apple Silicon Mac is a **dedicated ML accelerator** that usually sits
idle. This package puts it to work.

### vs. parakeet-coreml

Need even more speed? Our sister project
[parakeet-coreml](https://github.com/sebastian-software/parakeet-coreml) trades language coverage
for **40x real-time** performance.

|               | whisper-coreml           | parakeet-coreml |
| ------------- | ------------------------ | --------------- |
| **Best for**  | Accuracy, rare languages | Maximum speed   |
| **Speed**     | 14x real-time            | 40x real-time   |
| **Languages** | 99                       | 25 European     |

## Features

- 🎯 **99 Languages** – Full OpenAI Whisper multilingual support
- 🚀 **14x real-time** – 1 hour of audio in ~4.5 minutes (M1 Ultra)
- 🍎 **Neural Engine** – Runs on Apple's dedicated ML chip via CoreML
- 🔒 **Fully Offline** – No internet required after setup
- 📦 **Zero Dependencies** – No Python, no subprocess, no hassle
- 📝 **Timestamps** – Segment-level timing for subtitles
- ⬇️ **One Command Setup** – `npx whisper-coreml download`

## Get Started

```bash
# Install
npm install whisper-coreml

# Download the model (~3GB, one-time)
npx whisper-coreml download
```

**Requirements:** macOS 14+ (Sonoma), Apple Silicon (M1/M2/M3/M4), Node.js 20+

## Performance

Measured on M1 Ultra:

```
5 min audio  →  22 seconds  →  14x real-time
1 hour audio →  4.5 minutes
```

Run `npx whisper-coreml benchmark` to test on your machine.

## Quick Start

```typescript
import { WhisperAsrEngine, getModelPath } from "whisper-coreml"

const engine = new WhisperAsrEngine({
  modelPath: getModelPath()
})

await engine.initialize()

// Transcribe audio (16kHz, mono, Float32Array)
const result = await engine.transcribe(audioSamples, 16000)

console.log(result.text)
// "Hello, this is a test transcription."

console.log(`Language: ${result.language}`)
console.log(`Processed in ${result.durationMs}ms`)

// Segments include timestamps
for (const seg of result.segments) {
  console.log(`[${seg.startMs}ms - ${seg.endMs}ms] ${seg.text}`)
}

engine.cleanup()
```

## Audio Format

| Property    | Requirement                                   |
| ----------- | --------------------------------------------- |
| Sample Rate | **16,000 Hz** (16 kHz)                        |
| Channels    | **Mono** (single channel)                     |
| Format      | **Float32Array** with values between -1.0–1.0 |
| Duration    | **Any length** (auto-chunked internally)      |

### Converting Audio Files

Example with ffmpeg:

```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 -f f32le output.pcm
```

Then load the raw PCM file:

```typescript
import { readFileSync } from "fs"

const buffer = readFileSync("output.pcm")
const samples = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)
```

## CLI Commands

```bash
# Download the model (~1.5GB)
npx whisper-coreml download

# Check status
npx whisper-coreml status

# Run benchmark (requires cloned repo)
npx whisper-coreml benchmark

# Get model directory path
npx whisper-coreml path
```

## API Reference

### `WhisperAsrEngine`

The main class for speech recognition.

```typescript
new WhisperAsrEngine(options: WhisperAsrOptions)
```

#### Options

| Option      | Type     | Default  | Description                       |
| ----------- | -------- | -------- | --------------------------------- |
| `modelPath` | `string` | required | Path to ggml model file           |
| `language`  | `string` | `"auto"` | Language code or "auto" to detect |
| `threads`   | `number` | `0`      | CPU threads (0 = auto)            |

#### Methods

| Method                      | Description                    |
| --------------------------- | ------------------------------ |
| `initialize()`              | Load model (async)             |
| `transcribe(samples, rate)` | Transcribe audio               |
| `isReady()`                 | Check if engine is initialized |
| `cleanup()`                 | Release native resources       |
| `getVersion()`              | Get version information        |

### `TranscriptionResult`

```typescript
interface TranscriptionResult {
  text: string // Full transcription
  language: string // Detected language (ISO code)
  durationMs: number // Processing time in milliseconds
  segments: TranscriptionSegment[]
}

interface TranscriptionSegment {
  startMs: number // Segment start in milliseconds
  endMs: number // Segment end in milliseconds
  text: string // Transcription for this segment
  confidence: number // Confidence score (0-1)
}
```

### Helper Functions

| Function               | Description                            |
| ---------------------- | -------------------------------------- |
| `isAvailable()`        | Check if running on supported platform |
| `getDefaultModelDir()` | Get default model cache path           |
| `getModelPath()`       | Get path to the model file             |
| `isModelDownloaded()`  | Check if model is downloaded           |
| `downloadModel()`      | Download the model                     |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Node.js App                     │
├─────────────────────────────────────────────────────────┤
│                  whisper-coreml API                     │  TypeScript
├─────────────────────────────────────────────────────────┤
│                   Native Addon                          │  N-API + C++
│                  (whisper_engine)                       │
├─────────────────────────────────────────────────────────┤
│                    whisper.cpp                          │  C++
├─────────────────────────────────────────────────────────┤
│                      CoreML                             │  Apple Framework
├─────────────────────────────────────────────────────────┤
│                 Apple Neural Engine                     │  Dedicated ML Silicon
└─────────────────────────────────────────────────────────┘
```

## Use Cases

- **Maximum accuracy** – When other solutions aren't good enough
- **Rare languages** – 99 languages, far beyond English/European
- **Accented speech** – Whisper handles accents and dialects well
- **Noisy audio** – Robust to background noise and music

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT – see [LICENSE](LICENSE) for details.

## Credits

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) by Georgi Gerganov
- [OpenAI Whisper](https://github.com/openai/whisper) by OpenAI

---

<!-- sebastian-software-branding:start -->
<p align="center">
  <a href="https://oss.sebastian-software.com">
    <img src="https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg" alt="Sebastian Software" width="240" />
  </a>
</p>

<p align="center">
  <a href="https://oss.sebastian-software.com">Open Source at Sebastian Software</a><br />
  Copyright &copy; 2026 Sebastian Software GmbH
</p>
<!-- sebastian-software-branding:end -->
