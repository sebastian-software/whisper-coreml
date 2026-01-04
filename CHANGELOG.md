# Changelog

## [1.1.0](https://github.com/sebastian-software/whisper-coreml/compare/v1.0.2...v1.1.0) (2026-01-04)

### Features

- export SUPPORTED_LANGUAGES array and SupportedLanguage type
  ([f76e325](https://github.com/sebastian-software/whisper-coreml/commit/f76e3251497ab5e0f0e0c4590142e07019ab815d))

### Bug Fixes

- **ci:** add useGpu option and disable GPU for CI tests
  ([d6a39b1](https://github.com/sebastian-software/whisper-coreml/commit/d6a39b1b72ea768ed5328a5994175faf05ff6f55))
- **ci:** increase test timeout and remove redundant build job
  ([b6e685b](https://github.com/sebastian-software/whisper-coreml/commit/b6e685bf1b5de7fe0346caa6810d10f61c24157c))
- **ci:** remove broken ffmpeg cache, install directly
  ([20b089d](https://github.com/sebastian-software/whisper-coreml/commit/20b089d0d940cd7827a24bab44a42bb4913ea627))
- **ci:** use simple Node.js E2E runner instead of Vitest
  ([547745c](https://github.com/sebastian-software/whisper-coreml/commit/547745c7025ad378530365c41af267535b95d41f))
- download CoreML encoder model in addition to bin model
  ([7f1b427](https://github.com/sebastian-software/whisper-coreml/commit/7f1b4277c7da549e7fc21d56d9a26d8c86a5886f))

## [1.0.2](https://github.com/sebastian-software/whisper-coreml/compare/v1.0.1...v1.0.2) (2026-01-04)

### Bug Fixes

- **ci:** use dedicated vitest config for E2E tests with forks pool
  ([f50c1a9](https://github.com/sebastian-software/whisper-coreml/commit/f50c1a98623ffbf7e4f56e6ad0b6320619aa35a3))

## [1.0.1](https://github.com/sebastian-software/whisper-coreml/compare/v1.0.0...v1.0.1) (2026-01-03)

### Bug Fixes

- **ci:** use fork pool for E2E tests to avoid worker crashes
  ([78753f2](https://github.com/sebastian-software/whisper-coreml/commit/78753f2fba0777f2a96e4c4673057e0b6737386d))
- ignore coverage
  ([94551dd](https://github.com/sebastian-software/whisper-coreml/commit/94551dd0e8c639ee2673cf6f46d35a2c9a2a1b5d))

### Documentation

- add comment explaining uncovered error path
  ([c88384c](https://github.com/sebastian-software/whisper-coreml/commit/c88384ca948b28a5abad1343348aa5781c6d12be))

## [1.0.0](https://github.com/sebastian-software/whisper-coreml/compare/v0.2.0...v1.0.0) (2026-01-03)

### Documentation

- add codecov badge to README
  ([b831156](https://github.com/sebastian-software/whisper-coreml/commit/b831156634ef4f49df92387e9898e2caae183ac6))
- add comparison with non-CoreML alternatives
  ([717693c](https://github.com/sebastian-software/whisper-coreml/commit/717693c0d62b72fac9fdf70aa97bfed20d6f3ea9))
- remove translation as marketing feature
  ([98ee2a6](https://github.com/sebastian-software/whisper-coreml/commit/98ee2a65906365ac7a477529c4fcee16c3756021))
- rewrite README intro for clarity and impact
  ([f5da75e](https://github.com/sebastian-software/whisper-coreml/commit/f5da75ebcf4b343949519325ea5b2f3664914a05))

## 0.2.0 (2026-01-03)

### Features

- add check:whisper command to check for updates
  ([004c0e9](https://github.com/sebastian-software/whisper-coreml/commit/004c0e9ee2ff2c46e7962cec2cf075a031813a8b))
- add logo and update README
  ([b871693](https://github.com/sebastian-software/whisper-coreml/commit/b871693ef1957703abf9362ac4a0ce6a9d009b4c))
- enable CoreML acceleration and add benchmark
  ([f63d26a](https://github.com/sebastian-software/whisper-coreml/commit/f63d26ac8ccf9ed6c84d03ea47ca17c45d44a1a5))

### Bug Fixes

- added .env to ignore
  ([cb4abf4](https://github.com/sebastian-software/whisper-coreml/commit/cb4abf43b618bc95347b0f90fe12502321fb4792))
- adjust e2e tests for realistic expectations
  ([8399440](https://github.com/sebastian-software/whisper-coreml/commit/83994405903fda9cb6d0684ae7414325e70a202f))
- make logo symmetric
  ([10e4f95](https://github.com/sebastian-software/whisper-coreml/commit/10e4f95f2099f32749b147497eb6e399788929ec))
- pnpm usage
  ([a0054c7](https://github.com/sebastian-software/whisper-coreml/commit/a0054c72b4993ef014a4ea69d091d2b174f529d3))
- remove legacy package name from prepare script
  ([bebb8a2](https://github.com/sebastian-software/whisper-coreml/commit/bebb8a271eb017f1d7106344d197c710a71d7498))

### Documentation

- add ADR-004 for CoreML model versioning
  ([6ec7cb2](https://github.com/sebastian-software/whisper-coreml/commit/6ec7cb29d7771b2d8b9acca888ce8c7256c7311f))
- add OSS documentation and ADRs
  ([9e7e2e9](https://github.com/sebastian-software/whisper-coreml/commit/9e7e2e93f6ff603e524becff7d90214d707178e8))
- add performance benchmarks and comparison table
  ([575a5fc](https://github.com/sebastian-software/whisper-coreml/commit/575a5fc294fd775816242a7d142595f1a0675b99))
- correct parakeet language count to 25 European
  ([d89c90f](https://github.com/sebastian-software/whisper-coreml/commit/d89c90fa3f0606f50da3d56287c07fd8eb075bbc))
- fix parakeet language count in README
  ([84320f0](https://github.com/sebastian-software/whisper-coreml/commit/84320f05b629ed5dd794c3c064dd7c1c11104d11))
- remove Xcode requirement for end users
  ([e6271d6](https://github.com/sebastian-software/whisper-coreml/commit/e6271d62813f69a37111e08781e7b549478021df))
