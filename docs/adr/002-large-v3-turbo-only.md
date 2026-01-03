# ADR-002: Support Only large-v3-turbo Model

## Status

Accepted

## Context

OpenAI's Whisper comes in multiple model sizes:

| Model          | Parameters | Size  | Speed | Accuracy |
| -------------- | ---------- | ----- | ----- | -------- |
| tiny           | 39M        | 75MB  | Fast  | Low      |
| base           | 74M        | 142MB | Fast  | Low      |
| small          | 244M       | 466MB | Med   | Medium   |
| medium         | 769M       | 1.5GB | Slow  | Good     |
| large-v3       | 1.5B       | 3.1GB | Slow  | Best     |
| large-v3-turbo | 809M       | 1.6GB | Fast  | Best     |

We needed to decide which models to support.

## Decision

We chose to **support only large-v3-turbo** for the following reasons:

### 1. Clear Value Proposition

whisper-coreml exists for users who need **maximum accuracy**. If speed is the priority,
[parakeet-coreml](https://github.com/sebastian-software/parakeet-coreml) is faster (40x vs 14x
real-time).

Offering smaller, less accurate models would blur this distinction.

### 2. large-v3-turbo is the Sweet Spot

This model offers:

- **Same accuracy** as large-v3 (via distillation)
- **3x faster** than large-v3
- **Half the size** of large-v3 (1.6GB vs 3.1GB)

It's the optimal choice for quality-focused use cases.

### 3. Simplified API

One model means:

- No model selection complexity
- Single download command
- Predictable behavior
- Easier testing and maintenance

### 4. CoreML Model Maintenance

Each model requires a separate CoreML-converted encoder (~1.3GB each). Supporting multiple models
would:

- Increase Hugging Face storage costs
- Complicate the download logic
- Require testing each model

## Consequences

### Positive

- **Simple API** – No model configuration needed
- **Optimal quality** – Users always get the best model
- **Lower maintenance** – Single model to test and support
- **Clear positioning** – whisper-coreml = maximum accuracy

### Negative

- **Larger download** – 1.6GB + 1.3GB (CoreML) = ~3GB total
- **No size/speed tradeoffs** – Users can't choose smaller models
- **Not suitable for constrained environments** – If 3GB is too much, use parakeet-coreml

## Alternatives Considered

### Support All Models

Would allow flexibility but:

- Complicates API and documentation
- Blurs distinction from parakeet-coreml
- Higher maintenance burden

### Support tiny/base for Quick Testing

Users could test with smaller models, but:

- Creates confusion about production model choice
- "Testing" often becomes "production"
- Quality complaints from users using wrong model
