import { describe, expect, it } from "vitest"

import {
  getDefaultModelDir,
  getLoadError,
  getModelPath,
  isAvailable,
  isModelDownloaded,
  WhisperAsrEngine,
  WHISPER_MODEL
} from "../src/index.js"

describe("index", () => {
  describe("isAvailable", () => {
    it("returns true on macOS ARM64, false otherwise", () => {
      const result = isAvailable()
      expect(typeof result).toBe("boolean")

      if (process.platform === "darwin" && process.arch === "arm64") {
        expect(result).toBe(true)
      } else {
        expect(result).toBe(false)
      }
    })
  })

  describe("getLoadError", () => {
    it("returns null when addon loaded successfully", () => {
      // On a supported platform where addon loads, this should be null
      // On unsupported platforms, the addon won't be loaded yet
      const error = getLoadError()
      expect(error === null || error instanceof Error).toBe(true)
    })
  })

  describe("re-exports from download", () => {
    it("exports getDefaultModelDir", () => {
      expect(typeof getDefaultModelDir).toBe("function")
      const dir = getDefaultModelDir()
      expect(typeof dir).toBe("string")
      expect(dir).toContain("whisper-coreml")
    })

    it("exports getModelPath", () => {
      expect(typeof getModelPath).toBe("function")
      const path = getModelPath()
      expect(typeof path).toBe("string")
      expect(path).toContain("ggml-large-v3-turbo.bin")
    })

    it("exports isModelDownloaded", () => {
      expect(typeof isModelDownloaded).toBe("function")
      const result = isModelDownloaded()
      expect(typeof result).toBe("boolean")
    })

    it("exports WHISPER_MODEL", () => {
      expect(typeof WHISPER_MODEL).toBe("object")
      expect(WHISPER_MODEL.name).toBe("large-v3-turbo")
      expect(WHISPER_MODEL).toHaveProperty("size")
      expect(WHISPER_MODEL).toHaveProperty("languages")
    })
  })

  describe("WhisperAsrEngine", () => {
    // Only run these tests on supported platforms
    const describeOnMacOS =
      process.platform === "darwin" && process.arch === "arm64" ? describe : describe.skip

    describeOnMacOS("on macOS ARM64", () => {
      it("can be instantiated with model path", () => {
        const engine = new WhisperAsrEngine({ modelPath: "/fake/path.bin" })
        expect(engine).toBeInstanceOf(WhisperAsrEngine)
      })

      it("can be instantiated with all options", () => {
        const engine = new WhisperAsrEngine({
          modelPath: "/fake/path.bin",
          language: "de",
          threads: 4
        })
        expect(engine).toBeInstanceOf(WhisperAsrEngine)
      })

      it("isReady returns false before initialization", () => {
        const engine = new WhisperAsrEngine({ modelPath: "/fake/path.bin" })
        expect(engine.isReady()).toBe(false)
      })

      it("cleanup can be called before initialization without error", () => {
        const engine = new WhisperAsrEngine({ modelPath: "/fake/path.bin" })
        expect(() => engine.cleanup()).not.toThrow()
      })

      it("transcribe rejects before initialization", async () => {
        const engine = new WhisperAsrEngine({ modelPath: "/fake/path.bin" })
        const samples = new Float32Array(16000)
        await expect(engine.transcribe(samples)).rejects.toThrow("not initialized")
      })
    })
  })
})
