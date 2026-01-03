# ADR-003: Use whisper.cpp as Backend

## Status

Accepted

## Context

To run Whisper models on Apple Silicon, we evaluated several options:

1. **whisper.cpp** – C++ port with CoreML/Metal support
2. **OpenAI Whisper (Python)** – Original implementation, requires Python
3. **faster-whisper** – CTranslate2-based, Python bindings
4. **Custom CoreML conversion** – Convert PyTorch model directly to CoreML

## Decision

We chose **whisper.cpp** as our backend for the following reasons:

### 1. Production-Ready CoreML Support

whisper.cpp has mature CoreML integration:

- Encoder runs on Apple Neural Engine
- Decoder runs on Metal GPU
- Well-tested across Apple Silicon variants

### 2. No Python Runtime

Unlike Python-based solutions:

- No Python installation required
- No virtual environment management
- No subprocess overhead
- Simpler deployment

### 3. Active Maintenance

whisper.cpp is:

- Actively maintained by Georgi Gerganov (llama.cpp author)
- Regularly updated with upstream Whisper improvements
- Battle-tested in production applications

### 4. GGML Model Format

The GGML format provides:

- Efficient model loading
- Quantization support (if needed in future)
- Single-file distribution

### 5. N-API Compatibility

C++ integrates well with Node.js via N-API:

- No FFI overhead
- Direct memory sharing
- Stable ABI across Node.js versions

## Consequences

### Positive

- **Fast startup** – No Python interpreter initialization
- **Low memory overhead** – Efficient C++ implementation
- **Proven codebase** – Thousands of users, well-tested
- **Regular updates** – Active upstream development

### Negative

- **Build complexity** – Must compile whisper.cpp with CoreML flags
- **Vendor dependency** – Tied to whisper.cpp architecture
- **Update lag** – New Whisper features depend on whisper.cpp support

## Implementation

We integrate whisper.cpp as follows:

1. **Clone** – `scripts/prepare-whisper.sh` clones whisper.cpp
2. **Build** – CMake with `-DWHISPER_COREML=ON -DWHISPER_METAL=ON`
3. **Link** – Native addon links against `libwhisper.a` and `libwhisper.coreml.a`
4. **Wrap** – `whisper_engine.cc` provides N-API bindings

## Alternatives Considered

### OpenAI Whisper (Python)

The original implementation, but:

- Requires Python runtime
- Subprocess overhead for each call
- Complex deployment

### faster-whisper

CTranslate2-based, very fast, but:

- Python bindings only
- No CoreML support (uses CPU/CUDA)
- Would need custom Node.js bindings

### Custom CoreML Conversion

Convert PyTorch → CoreML directly:

- Maximum control
- But requires deep CoreML expertise
- Model updates require reconversion
- whisper.cpp already solved this
