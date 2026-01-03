# Architecture

This document describes the technical architecture of whisper-coreml.

## Overview

whisper-coreml is a Node.js native addon that provides speech-to-text functionality using
whisper.cpp with Apple's CoreML framework. It bridges JavaScript to native C++ code, which
interfaces with whisper.cpp for inference on Apple's Neural Engine (ANE).

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Application                           │
│                        (Node.js)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TypeScript API Layer                         │
│                      src/index.ts                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ WhisperAsrEngine│  │   transcribe()  │  │  auto-download │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Native Addon (N-API)                         │
│                      src/addon.cc                               │
│   initialize, transcribe, cleanup, getVersion                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Whisper Engine                              │
│                   src/whisper_engine.cc                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     whisper.cpp                            │ │
│  │  - Encoder (transforms audio → embeddings)                 │ │
│  │  - Decoder (generates text tokens)                         │ │
│  │  - CoreML backend for ANE acceleration                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│         CoreML            │   │      CPU Fallback         │
│  (Neural Engine / GPU)    │   │   (when ANE unavailable)  │
└───────────────────────────┘   └───────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Apple Neural Engine                          │
│              Dedicated ML silicon on Apple chips                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Transcription Pipeline

```
Audio Samples (Float32Array, 16kHz, mono)
           │
           ▼
    ┌───────────────────────────────────────────────────┐
    │              Pre-processing                        │
    │  - Sample rate conversion (if needed)             │
    │  - Mel spectrogram computation                    │
    └───────────────────────────────────────────────────┘
           │
           ▼
    ┌───────────────────────────────────────────────────┐
    │                  Encoder                          │
    │  - Processes mel spectrogram                      │
    │  - Produces audio embeddings                      │
    │  - Runs on Neural Engine via CoreML               │
    └───────────────────────────────────────────────────┘
           │
           ▼
    ┌───────────────────────────────────────────────────┐
    │                  Decoder                          │
    │  - Auto-regressive token generation               │
    │  - Language detection (if auto)                   │
    │  - Timestamp generation                           │
    └───────────────────────────────────────────────────┘
           │
           ▼
    Result: { text, language, segments[] }
```

## Components

### TypeScript Layer (`src/`)

| File            | Purpose                                     |
| --------------- | ------------------------------------------- |
| `index.ts`      | Main API: `WhisperAsrEngine` class          |
| `download.ts`   | Model download from Hugging Face            |
| `cli.ts`        | CLI tool for model management and benchmark |
| `bindings.d.ts` | Type declarations for `bindings` package    |

### Native Layer (`src/*.cc`, `src/*.h`)

| File                   | Purpose                               |
| ---------------------- | ------------------------------------- |
| `addon.cc`             | N-API bindings, exports to JavaScript |
| `whisper_engine.cc/.h` | Whisper.cpp wrapper, model management |

### External Dependencies

| Component     | Location                | Purpose                   |
| ------------- | ----------------------- | ------------------------- |
| whisper.cpp   | `vendor/whisper.cpp/`   | Core inference engine     |
| CoreML models | Generated at build time | ANE-accelerated inference |

## Models

Models are downloaded from Hugging Face (ggerganov/whisper.cpp):

| Model            | Size   | Speed    | Accuracy      |
| ---------------- | ------ | -------- | ------------- |
| `tiny`           | 75 MB  | Fastest  | Basic         |
| `base`           | 142 MB | Fast     | Good          |
| `small`          | 466 MB | Medium   | Better        |
| `medium`         | 1.5 GB | Slow     | High          |
| `large-v3`       | 2.9 GB | Slowest  | Best          |
| `large-v3-turbo` | 1.5 GB | **Fast** | **Near-best** |

Models are cached in `~/.cache/whisper-coreml/models/`.

## Key Design Decisions

### 1. CoreML for Neural Engine

We use CoreML to leverage Apple's Neural Engine for inference. This provides:

- Significant speedup over CPU-only inference
- Lower power consumption
- Automatic fallback to GPU/CPU when ANE is busy

### 2. N-API for Node.js Bindings

N-API provides:

- ABI stability across Node.js versions
- No recompilation needed for minor Node.js updates
- Clean async/sync API patterns

### 3. whisper.cpp as Backend

whisper.cpp provides:

- Optimized C++ implementation
- Native CoreML integration
- GGML format for efficient model loading
- Active maintenance and updates

## Memory Management

- **Native addon**: RAII patterns for automatic cleanup
- **Model loading**: Models loaded once during `initialize()`
- **Cleanup**: `cleanup()` releases all resources

## Thread Safety

- The current implementation uses a **single engine instance**
- Concurrent calls to `transcribe()` are not thread-safe
- For concurrent transcription, create multiple engine instances

## Performance Characteristics

| Metric              | Value (large-v3-turbo) | Notes                   |
| ------------------- | ---------------------- | ----------------------- |
| Model load          | 2-5s                   | One-time initialization |
| Transcription speed | 10-40x real-time       | Depends on chip         |
| Memory usage        | ~500MB                 | With model loaded       |
| Max audio length    | 30s                    | Whisper model limit     |

Note: For audio longer than 30 seconds, implement chunking at the application level.
