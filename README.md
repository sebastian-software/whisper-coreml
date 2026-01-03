# whisper-coreml

<p align="center">
  <strong>OpenAI Whisper ASR for Node.js with CoreML/ANE acceleration on Apple Silicon</strong>
</p>

<p align="center">
  <a href="https://github.com/sebastian-software/whisper-coreml/actions/workflows/ci.yml"><img src="https://github.com/sebastian-software/whisper-coreml/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/whisper-coreml"><img src="https://img.shields.io/npm/v/whisper-coreml.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/whisper-coreml"><img src="https://img.shields.io/npm/dm/whisper-coreml.svg" alt="npm downloads"></a>
  <br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

Powered by [whisper.cpp](https://github.com/ggerganov/whisper.cpp) running on Apple's Neural Engine
via CoreML.

## Why whisper-coreml?

When you need **higher transcription quality** than
[parakeet-coreml](https://github.com/sebastian-software/parakeet-coreml), Whisper's large-v3-turbo
model delivers. It offers:

- **99 language support** vs Parakeet's ~15 languages
- **Better accuracy** on challenging audio (accents, background noise)
- **Translation capability** (any language → English)
- **Word-level confidence scores**

### When to Use Which

| Use Case                            | Recommended                                                              |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Fast transcription, major languages | [parakeet-coreml](https://github.com/sebastian-software/parakeet-coreml) |
| Maximum accuracy, any language      | **whisper-coreml**                                                       |
| Translation to English              | **whisper-coreml**                                                       |
| Edge cases (accents, noise)         | **whisper-coreml**                                                       |

## Features

- 🎯 **99 Languages** – Full Whisper multilingual support
- 🍎 **Neural Engine Acceleration** – Runs on Apple's dedicated ML silicon
- 🔒 **Fully Offline** – All processing happens locally
- 📦 **Zero Runtime Dependencies** – No Python, no subprocess
- 📝 **Timestamps** – Segment-level timing for subtitles
- 🔄 **Translation** – Translate any language to English
- ⬇️ **Easy Setup** – Single CLI command to download the model

## Requirements

- macOS 14.0+ (Sonoma or later)
- Apple Silicon (M1, M2, M3, M4 – any variant)
- Node.js 20+
- Xcode Command Line Tools

## Installation

```bash
npm install whisper-coreml
```

### Download the Model

```bash
npx whisper-coreml download
```

This downloads the **large-v3-turbo** model (~1.5GB) – the only model we support, as it offers the
best speed/quality ratio.

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
| Duration    | Up to ~30 seconds per call                    |

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

| Option      | Type      | Default  | Description                       |
| ----------- | --------- | -------- | --------------------------------- |
| `modelPath` | `string`  | required | Path to ggml model file           |
| `language`  | `string`  | `"auto"` | Language code or "auto" to detect |
| `translate` | `boolean` | `false`  | Translate to English              |
| `threads`   | `number`  | `0`      | CPU threads (0 = auto)            |

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

## Translation

Translate any language to English:

```typescript
const engine = new WhisperAsrEngine({
  modelPath: getModelPath(),
  language: "de", // German input
  translate: true // Output in English
})
```

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

- **Maximum accuracy** – When Parakeet's quality isn't sufficient
- **Rare languages** – Languages not supported by Parakeet
- **Translation** – Convert foreign speech to English text
- **Accented speech** – Whisper handles accents better
- **Noisy audio** – More robust to background noise

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT – see [LICENSE](LICENSE) for details.

## Credits

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) by Georgi Gerganov
- [OpenAI Whisper](https://github.com/openai/whisper) by OpenAI

---

Copyright © 2026 [Sebastian Software GmbH](https://sebastian-software.de), Mainz, Germany
