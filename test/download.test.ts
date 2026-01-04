import { describe, expect, it } from "vitest"

import {
  formatBytes,
  getDefaultModelDir,
  getModelPath,
  getCoreMLModelPath,
  isModelDownloaded,
  isBinModelDownloaded,
  isCoreMLModelDownloaded,
  WHISPER_MODEL
} from "../src/download.js"

describe("download", () => {
  describe("WHISPER_MODEL", () => {
    it("is large-v3-turbo", () => {
      expect(WHISPER_MODEL.name).toBe("large-v3-turbo")
    })

    it("has required properties", () => {
      expect(WHISPER_MODEL).toHaveProperty("name")
      expect(WHISPER_MODEL).toHaveProperty("size")
      expect(WHISPER_MODEL).toHaveProperty("languages")
      expect(WHISPER_MODEL).toHaveProperty("url")
      expect(typeof WHISPER_MODEL.size).toBe("string")
      expect(typeof WHISPER_MODEL.languages).toBe("string")
      expect(typeof WHISPER_MODEL.url).toBe("string")
      expect(WHISPER_MODEL.url).toContain("huggingface.co")
    })
  })

  describe("getDefaultModelDir", () => {
    it("returns a path containing whisper-coreml", () => {
      const dir = getDefaultModelDir()
      expect(typeof dir).toBe("string")
      expect(dir).toContain("whisper-coreml")
      expect(dir).toContain("models")
    })

    it("returns a path in the user home directory", () => {
      const dir = getDefaultModelDir()
      expect(dir).toContain(".cache")
    })
  })

  describe("getModelPath", () => {
    it("returns correct path for model", () => {
      const path = getModelPath()
      expect(path).toContain("ggml-large-v3-turbo.bin")
    })

    it("uses custom modelDir when provided", () => {
      const path = getModelPath("/custom/dir")
      expect(path).toBe("/custom/dir/ggml-large-v3-turbo.bin")
    })
  })

  describe("getCoreMLModelPath", () => {
    it("returns correct path for CoreML model", () => {
      const path = getCoreMLModelPath()
      expect(path).toContain("ggml-large-v3-turbo-encoder.mlmodelc")
    })

    it("uses custom modelDir when provided", () => {
      const path = getCoreMLModelPath("/custom/dir")
      expect(path).toBe("/custom/dir/ggml-large-v3-turbo-encoder.mlmodelc")
    })
  })

  describe("isModelDownloaded", () => {
    it("returns false for non-existent path", () => {
      const result = isModelDownloaded("/non/existent/path")
      expect(result).toBe(false)
    })

    it("returns a boolean", () => {
      const result = isModelDownloaded()
      expect(typeof result).toBe("boolean")
    })
  })

  describe("isBinModelDownloaded", () => {
    it("returns false for non-existent path", () => {
      const result = isBinModelDownloaded("/non/existent/path")
      expect(result).toBe(false)
    })

    it("returns a boolean", () => {
      const result = isBinModelDownloaded()
      expect(typeof result).toBe("boolean")
    })
  })

  describe("isCoreMLModelDownloaded", () => {
    it("returns false for non-existent path", () => {
      const result = isCoreMLModelDownloaded("/non/existent/path")
      expect(result).toBe(false)
    })

    it("returns a boolean", () => {
      const result = isCoreMLModelDownloaded()
      expect(typeof result).toBe("boolean")
    })
  })

  describe("formatBytes", () => {
    it("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B")
      expect(formatBytes(500)).toBe("500 B")
      expect(formatBytes(1023)).toBe("1023 B")
    })

    it("formats kilobytes correctly", () => {
      expect(formatBytes(1024)).toBe("1.0 KB")
      expect(formatBytes(1536)).toBe("1.5 KB")
      expect(formatBytes(10240)).toBe("10.0 KB")
    })

    it("formats megabytes correctly", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.0 MB")
      expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB")
      expect(formatBytes(500 * 1024 * 1024)).toBe("500.0 MB")
    })

    it("formats gigabytes correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.00 GB")
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.50 GB")
    })
  })
})
