import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it, beforeAll, afterAll } from "vitest"

import {
  WhisperAsrEngine,
  isAvailable,
  isModelDownloaded,
  getDefaultModelDir,
  getModelPath
} from "../src/index.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Load audio file as Float32Array using ffmpeg
 */
function loadAudio(path: string, duration?: number): Float32Array {
  const durationArg = duration ? `-t ${String(duration)}` : ""
  const pcmBuffer = execSync(
    `ffmpeg -i "${path}" ${durationArg} -ar 16000 -ac 1 -f s16le -acodec pcm_s16le -`,
    { encoding: "buffer", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 }
  )
  const pcm16 = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2)
  const samples = new Float32Array(pcm16.length)
  for (let i = 0; i < pcm16.length; i++) {
    samples[i] = (pcm16[i] ?? 0) / 32768.0
  }
  return samples
}

const AUDIO_FILE = join(__dirname, "fixtures/brian.ogg")

/**
 * E2E tests for the Whisper ASR engine.
 * These tests require macOS, downloaded model, and ffmpeg.
 */
describe.runIf(isAvailable())("E2E: WhisperAsrEngine", () => {
  let engine: WhisperAsrEngine

  beforeAll(async () => {
    // Check for audio file
    if (!existsSync(AUDIO_FILE)) {
      console.log("Test audio file not found:", AUDIO_FILE)
      return
    }

    // Skip if model not downloaded
    if (!isModelDownloaded()) {
      console.log(`Model not found at ${getDefaultModelDir()}`)
      console.log('Run "npx whisper-coreml download" to enable E2E tests')
      return
    }

    engine = new WhisperAsrEngine({ modelPath: getModelPath() })
    await engine.initialize()
  }, 60000) // 60s timeout for initialization

  afterAll(() => {
    engine?.cleanup()
  })

  it("should load the native addon on macOS", () => {
    expect(isAvailable()).toBe(true)
  })

  describe.runIf(isModelDownloaded())("with model", () => {
    it("should initialize the engine", () => {
      expect(engine.isReady()).toBe(true)
    })

    it("should return version info", () => {
      const version = engine.getVersion()
      expect(version).toHaveProperty("addon")
      expect(version).toHaveProperty("whisper")
      expect(version).toHaveProperty("coreml")
    })

    it("should handle silence without crashing", async () => {
      const samples = new Float32Array(16000 * 2) // 2s silence

      const result = await engine.transcribe(samples)

      // Whisper may hallucinate on silence, so we just check it doesn't crash
      expect(result).toHaveProperty("text")
      expect(result.durationMs).toBeGreaterThan(0)
    })

    it("should handle sine wave tone", async () => {
      // Generate 1 second of 440Hz sine wave (A4 note)
      const sampleRate = 16000
      const frequency = 440
      const samples = new Float32Array(sampleRate)

      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.5
      }

      const result = await engine.transcribe(samples)

      // Should not crash
      expect(result).toHaveProperty("text")
      expect(result).toHaveProperty("segments")
      expect(result.durationMs).toBeGreaterThan(0)
    })

    it("should transcribe short speech audio with timestamps", async () => {
      // Load first 10 seconds
      const samples = loadAudio(AUDIO_FILE, 10)

      const result = await engine.transcribe(samples)

      expect(result.segments.length).toBeGreaterThan(0)
      expect(result.text.length).toBeGreaterThan(0)
      expect(result.durationMs).toBeGreaterThan(0)
      expect(result.language).toBeTruthy()

      // Check segment structure
      for (const segment of result.segments) {
        expect(segment).toHaveProperty("startMs")
        expect(segment).toHaveProperty("endMs")
        expect(segment).toHaveProperty("text")
        expect(segment).toHaveProperty("confidence")
        expect(segment.endMs).toBeGreaterThan(segment.startMs)
      }
    })

    it("should transcribe with language info", async () => {
      const samples = loadAudio(AUDIO_FILE, 5)

      const result = await engine.transcribe(samples)

      // Language is either detected ("en") or config value ("auto")
      expect(result.language).toBeTruthy()
      expect(["en", "auto"]).toContain(result.language)
    })
  })
})
