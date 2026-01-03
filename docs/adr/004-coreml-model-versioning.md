# ADR-004: CoreML Model Versioning

## Status

Accepted

## Context

The whisper-coreml package requires two model files:

1. **GGML model** (`ggml-large-v3-turbo.bin`) – From whisper.cpp repo
2. **CoreML encoder** (`ggml-large-v3-turbo-encoder.mlmodelc`) – Hosted on our Hugging Face

We need to clarify when each model needs updating.

## Decision

### GGML Model (from ggerganov/whisper.cpp)

The GGML model is downloaded directly from the whisper.cpp repository. It updates when:

- OpenAI releases a new Whisper model version
- whisper.cpp changes the GGML format (rare)

**No action required** – users automatically get the latest from upstream.

### CoreML Encoder (our Hugging Face repo)

The CoreML encoder is converted from the PyTorch model and hosted at
`sebastian-software/whisper-coreml-models`. It needs updating when:

| Situation                                      | Update Required |
| ---------------------------------------------- | --------------- |
| whisper.cpp version update                     | ❌ No           |
| whisper.cpp bugfix/performance                 | ❌ No           |
| New Whisper model (e.g., large-v4)             | ✅ Yes          |
| CoreML conversion script changes output format | ✅ Yes (rare)   |

### Why whisper.cpp Updates Don't Affect CoreML

The CoreML model is converted directly from **OpenAI's PyTorch weights**, not from whisper.cpp:

```
OpenAI Whisper (PyTorch) → coremltools → CoreML .mlmodelc
```

whisper.cpp is only used for:

1. Running the conversion script (`models/convert-whisper-to-coreml.py`)
2. Loading and running the model at inference time

The CoreML model format is stable across whisper.cpp versions.

## Consequences

### Positive

- Simpler maintenance – CoreML model rarely needs updating
- Users benefit from whisper.cpp updates without re-downloading models
- Clear separation of concerns

### Negative

- Must monitor OpenAI for new Whisper releases
- Manual process to reconvert and upload when needed

## Update Process

When a new Whisper model is released:

```bash
# 1. Update whisper.cpp
pnpm run check:whisper
# Edit package.json if update available
rm -rf vendor/whisper.cpp
pnpm run prepare:whisper

# 2. Convert new CoreML model
cd vendor/whisper.cpp
source .venv/bin/activate
python3 models/convert-whisper-to-coreml.py \
  --model large-v3-turbo \  # or new model name
  --encoder-only True \
  --optimize-ane True

# 3. Upload to Hugging Face
huggingface-cli upload sebastian-software/whisper-coreml-models \
  models/ggml-large-v3-turbo-encoder.mlmodelc \
  ggml-large-v3-turbo-encoder.mlmodelc \
  --repo-type model

# 4. Update download.ts with new model name/path if needed
# 5. Test thoroughly
# 6. Release new package version
```
