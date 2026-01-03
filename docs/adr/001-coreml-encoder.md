# ADR-001: Use CoreML Encoder for Neural Engine

## Status

Accepted

## Context

whisper.cpp supports multiple backends for inference:

1. **CPU** – Works everywhere, but slow
2. **Metal** – GPU acceleration on Apple Silicon
3. **CoreML** – Runs encoder on Apple Neural Engine (ANE)

The Whisper model has two main components:

- **Encoder** – Processes audio mel spectrograms (compute-intensive)
- **Decoder** – Generates text tokens (autoregressive, harder to accelerate)

## Decision

We chose to **always enable CoreML for the encoder** and let whisper.cpp handle the decoder on
Metal/CPU.

### Why CoreML for the Encoder?

The encoder is a transformer that processes the entire audio in one pass. This is ideal for the
Neural Engine because:

- **Highly parallelizable** – No sequential dependencies
- **Fixed input size** – 30-second mel spectrogram chunks
- **Large matrix operations** – ANE excels at these

### Why Not CoreML for the Decoder?

The decoder generates tokens one at a time, making it:

- **Inherently sequential** – Each token depends on previous ones
- **Small batch size** – ANE overhead exceeds benefits
- **Better suited for Metal** – GPU handles small operations efficiently

## Consequences

### Positive

- **Faster encoding** – ANE delivers significant speedup (14x real-time on M1 Ultra)
- **Lower power consumption** – ANE is more efficient than GPU/CPU
- **Frees GPU** – Decoder runs on Metal while encoder uses ANE

### Negative

- **Requires CoreML model** – Must download separate `.mlmodelc` file (~1.3GB)
- **First-run compilation** – CoreML compiles the model on first use (~2 minutes)
- **macOS only** – CoreML is Apple-exclusive

## Implementation

The CoreML encoder model is:

1. Downloaded from Hugging Face (`sebastian-software/whisper-coreml-models`)
2. Stored in `~/.cache/whisper-coreml/models/`
3. Loaded by whisper.cpp via `whisper_init_state()` with CoreML path

```cpp
// Pass CoreML model path during initialization
params.coreml_model_path = "/path/to/ggml-large-v3-turbo-encoder.mlmodelc";
```
