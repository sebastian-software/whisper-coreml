# whisper-coreml

OpenAI Whisper ASR for Node.js with **CoreML/ANE acceleration** on Apple Silicon.

Based on [whisper.cpp](https://github.com/ggerganov/whisper.cpp) with Apple Neural Engine support
for optimal performance.

## Features

- 🚀 **CoreML/ANE accelerated** - Runs on Apple Neural Engine
- 🌍 **99 languages** - Full Whisper multilingual support
- 📝 **Timestamps** - Word-level timing for subtitles
- 🔄 **Translation** - Translate any language to English
- 🔒 **Fully offline** - No data leaves your device
- 📦 **Native Node.js addon** - No Python, no subprocess

## Requirements

- macOS 14.0+
- Apple Silicon (M1/M2/M3/M4)
- Node.js 20+

## Installation

```bash
npm install whisper-coreml
```

### First-time Setup

```bash
# 1. Build whisper.cpp
npm run prepare:whisper

# 2. Download a model
npm run download:model large-v3-turbo
```

## Usage

```typescript
import { WhisperAsrEngine } from "whisper-coreml"

const engine = new WhisperAsrEngine({
  modelPath: "./models/ggml-large-v3-turbo.bin",
  language: "auto"
})

await engine.initialize()

// Transcribe audio (16kHz, mono, Float32)
const result = await engine.transcribe(audioSamples, 16000)

console.log(result.text)
// "Hello, this is a transcription test."

console.log(result.segments)
// [{ startMs: 0, endMs: 2500, text: "Hello, this is...", confidence: 0.95 }]

engine.cleanup()
```

### Translation

```typescript
const engine = new WhisperAsrEngine({
  modelPath: "./models/ggml-large-v3-turbo.bin",
  language: "de", // German input
  translate: true // Output in English
})
```

## Models

| Model            | Size   | Speed    | Accuracy      |
| ---------------- | ------ | -------- | ------------- |
| `tiny`           | 75 MB  | Fastest  | Basic         |
| `base`           | 142 MB | Fast     | Good          |
| `small`          | 466 MB | Medium   | Better        |
| `medium`         | 1.5 GB | Slow     | High          |
| `large-v3`       | 2.9 GB | Slowest  | Best          |
| `large-v3-turbo` | 1.5 GB | **Fast** | **Near-best** |

## API

### `WhisperAsrEngine`

```typescript
new WhisperAsrEngine({
  modelPath: string,    // Path to ggml model
  language?: string,    // "auto" or ISO code
  translate?: boolean,  // Translate to English
  threads?: number      // CPU threads (0 = auto)
})
```

#### Methods

| Method                            | Description        |
| --------------------------------- | ------------------ |
| `initialize()`                    | Load model (async) |
| `isReady()`                       | Check if ready     |
| `transcribe(samples, sampleRate)` | Transcribe audio   |
| `cleanup()`                       | Release resources  |

### `TranscriptionResult`

```typescript
interface TranscriptionResult {
  text: string
  language: string
  durationMs: number
  segments: TranscriptionSegment[]
}

interface TranscriptionSegment {
  startMs: number
  endMs: number
  text: string
  confidence: number
}
```

## Architecture

```
┌─────────────────┐
│   Node.js API   │  TypeScript
├─────────────────┤
│  Native Addon   │  N-API + C++
├─────────────────┤
│   whisper.cpp   │  C++ inference
├─────────────────┤
│    CoreML       │  Apple Neural Engine
└─────────────────┘
```

## License

MIT

## Credits

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) by Georgi Gerganov
- [OpenAI Whisper](https://github.com/openai/whisper) by OpenAI
