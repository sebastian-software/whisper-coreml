# Contributing to whisper-coreml

Thank you for your interest in contributing! This document provides guidelines and instructions for
contributing.

## Development Setup

### Prerequisites

- macOS 14.0+ on Apple Silicon (M1/M2/M3/M4)
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Xcode Command Line Tools (`xcode-select --install`)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/sebastian-software/whisper-coreml.git
cd whisper-coreml

# Install dependencies
pnpm install

# Prepare whisper.cpp (one-time setup, builds with CoreML support)
pnpm run prepare:whisper

# Build the project
pnpm build

# Download models for testing
pnpm exec whisper-coreml download

# Run tests
pnpm test
```

### Project Structure

```
whisper-coreml/
├── src/
│   ├── index.ts           # Main TypeScript API
│   ├── download.ts        # Model download logic
│   ├── cli.ts             # CLI tool
│   ├── addon.cc           # N-API addon entry
│   ├── whisper_engine.cc  # Whisper engine wrapper
│   └── whisper_engine.h   # C++ header
├── test/
│   ├── *.test.ts          # Unit tests
│   ├── e2e.test.ts        # E2E tests (requires models)
│   └── fixtures/          # Test audio files
├── scripts/
│   └── prepare-whisper.sh # Builds whisper.cpp with CoreML
├── vendor/
│   └── whisper.cpp/       # whisper.cpp (cloned by prepare script)
├── docs/
│   └── adr/               # Architecture Decision Records
├── dist/                  # Built TypeScript
└── build/                 # Built native addon
```

## Development Workflow

### Commands

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `pnpm build`             | Build native addon + TypeScript |
| `pnpm run build:native`  | Build only native addon         |
| `pnpm run build:ts`      | Build only TypeScript           |
| `pnpm test`              | Run unit tests                  |
| `pnpm run test:coverage` | Run tests with coverage         |
| `pnpm run benchmark`     | Run performance benchmark       |
| `pnpm lint`              | Run ESLint                      |
| `pnpm format`            | Format code with Prettier       |
| `pnpm typecheck`         | TypeScript type checking        |

### Code Style

- ESLint with strict TypeScript rules
- Prettier for formatting
- Conventional Commits for commit messages

Commit message format:

```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
chore: maintenance tasks
test: adding tests
refactor: code refactoring
```

### Pre-commit Hooks

The project uses Husky to run:

- **pre-commit**: Prettier formatting via lint-staged
- **pre-push**: ESLint + TypeScript checks + Tests
- **commit-msg**: Conventional commit validation

## Submitting Changes

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit using conventional commits
6. Push to your fork
7. Open a Pull Request

### PR Guidelines

- Keep PRs focused on a single change
- Include tests for new features
- Update documentation if needed
- Ensure CI passes

## Reporting Issues

### Bug Reports

Please include:

- macOS version and chip (e.g., macOS 14.2, M3 Pro)
- Node.js version (`node --version`)
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests

- Describe the use case
- Explain why it would be useful
- Consider if it fits the project scope (macOS/CoreML focused)

## Architecture Decisions

Significant decisions are documented in [docs/adr/](docs/adr/). When making architectural changes,
please add an ADR explaining the reasoning.

## Questions?

Feel free to open a Discussion or Issue if you have questions!
