#!/usr/bin/env node
/**
 * Simple E2E test runner that bypasses Vitest worker issues
 */
const { execSync } = require("node:child_process")
const { existsSync } = require("node:fs")
const path = require("node:path")

const AUDIO_FILE = path.join(__dirname, "fixtures/brian.ogg")

function loadAudio(filePath, duration) {
  const durationArg = duration ? `-t ${duration}` : ""
  const pcmBuffer = execSync(
    `ffmpeg -i "${filePath}" ${durationArg} -ar 16000 -ac 1 -f s16le -acodec pcm_s16le -`,
    { encoding: "buffer", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 }
  )
  const pcm16 = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2)
  const samples = new Float32Array(pcm16.length)
  for (let i = 0; i < pcm16.length; i++) {
    samples[i] = (pcm16[i] ?? 0) / 32768.0
  }
  return samples
}

async function runTests() {
  console.log("E2E Test Runner")
  console.log("===============\n")

  // Load the module
  const {
    WhisperAsrEngine,
    isAvailable,
    isModelDownloaded,
    getModelPath
  } = require("../dist/index.cjs")

  // Test 1: Check availability
  console.log("Test 1: Platform check")
  if (!isAvailable()) {
    console.log("⚠ Skipping: Not running on macOS ARM64")
    process.exit(0)
  }
  console.log("✓ Running on macOS ARM64\n")

  // Test 2: Check model
  console.log("Test 2: Model check")
  if (!isModelDownloaded()) {
    console.log("✗ Model not downloaded")
    process.exit(1)
  }
  console.log("✓ Model found\n")

  // Test 3: Check audio file
  console.log("Test 3: Audio file check")
  if (!existsSync(AUDIO_FILE)) {
    console.log("✗ Audio file not found:", AUDIO_FILE)
    process.exit(1)
  }
  console.log("✓ Audio file found\n")

  // Test 4: Initialize engine
  console.log("Test 4: Initialize engine")
  console.log("  Model path:", getModelPath())

  // Check if CoreML model exists
  const coremlPath = getModelPath().replace(".bin", "-encoder.mlmodelc")
  console.log("  CoreML path:", coremlPath)
  console.log("  CoreML exists:", existsSync(coremlPath))

  // Allow disabling GPU for CI debugging
  const useGpu = process.env.WHISPER_USE_GPU !== "false"
  console.log("  Use GPU/CoreML:", useGpu)

  const engine = new WhisperAsrEngine({ modelPath: getModelPath(), useGpu })
  await engine.initialize()
  if (!engine.isReady()) {
    console.log("✗ Engine not ready")
    process.exit(1)
  }
  console.log("✓ Engine initialized\n")

  // Test 5: Get version
  console.log("Test 5: Version info")
  const version = engine.getVersion()
  console.log("  Addon:", version.addon)
  console.log("  Whisper:", version.whisper)
  console.log("  CoreML:", version.coreml)
  console.log("✓ Version info retrieved\n")

  // Test 6: Transcribe silence
  console.log("Test 6: Transcribe silence (2s)")
  const silence = new Float32Array(16000 * 2)
  const silenceResult = await engine.transcribe(silence)
  console.log("  Duration:", silenceResult.durationMs, "ms")
  console.log("  Text:", JSON.stringify(silenceResult.text))
  console.log("✓ Silence handled\n")

  // Test 7: Transcribe real audio
  console.log("Test 7: Transcribe real audio (10s)")
  const samples = loadAudio(AUDIO_FILE, 10)
  const result = await engine.transcribe(samples)
  console.log("  Duration:", result.durationMs, "ms")
  console.log("  Language:", result.language)
  console.log("  Segments:", result.segments.length)
  console.log("  Text:", result.text.substring(0, 100) + "...")

  if (result.segments.length === 0) {
    console.log("✗ No segments returned")
    process.exit(1)
  }
  console.log("✓ Audio transcribed\n")

  // Cleanup
  engine.cleanup()

  console.log("===============")
  console.log("All tests passed! ✓")
}

runTests().catch((err) => {
  console.error("✗ Test failed:", err.message)
  console.error(err.stack)
  process.exit(1)
})
