# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for whisper-coreml.

## What are ADRs?

ADRs document significant architectural decisions made during development. They capture:

- **Context** – Why was a decision needed?
- **Decision** – What was decided?
- **Consequences** – What are the implications?

## Index

| ADR                               | Title                                | Status   |
| --------------------------------- | ------------------------------------ | -------- |
| [001](001-coreml-encoder.md)      | Use CoreML Encoder for Neural Engine | Accepted |
| [002](002-large-v3-turbo-only.md) | Support Only large-v3-turbo Model    | Accepted |
| [003](003-whisper-cpp-backend.md) | Use whisper.cpp as Backend           | Accepted |

## Creating New ADRs

When making a significant architectural decision:

1. Copy `template.md` to `NNN-title.md`
2. Fill in Context, Decision, and Consequences
3. Add to the index above
4. Submit with the implementing PR

## Template

See [template.md](template.md) for the ADR template.
