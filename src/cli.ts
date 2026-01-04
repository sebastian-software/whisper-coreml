#!/usr/bin/env node
/**
 * CLI for whisper-coreml
 */

import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"

import {
  downloadModel,
  downloadCoreMLModel,
  getDefaultModelDir,
  getModelPath,
  isModelDownloaded,
  isBinModelDownloaded,
  isCoreMLModelDownloaded,
  WHISPER_MODEL
} from "./download.js"

import { WhisperAsrEngine, isAvailable } from "./index.js"

const args = process.argv.slice(2)
const command = args[0]

function printHelp(): void {
  console.log(`
whisper-coreml CLI

Commands:
  download [--force]  Download the Whisper model (~1.5GB)
  benchmark           Run performance benchmark
  status              Check if model is downloaded
  path                Print model directory path

The large-v3-turbo model offers the best speed/quality ratio
and is the reason to choose Whisper over Parakeet.

Options:
  --force             Force re-download even if model exists
  --help, -h          Show this help message
`)
}

/**
 * Load audio file as Float32Array using ffmpeg
 */
function loadAudio(path: string): Float32Array {
  try {
    // Convert to raw PCM using ffmpeg
    const pcmBuffer = execSync(`ffmpeg -i "${path}" -ar 16000 -ac 1 -f s16le -acodec pcm_s16le -`, {
      encoding: "buffer",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024
    })
    const pcm16 = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2)
    const samples = new Float32Array(pcm16.length)
    for (let i = 0; i < pcm16.length; i++) {
      samples[i] = (pcm16[i] ?? 0) / 32768.0
    }
    return samples
  } catch {
    console.error("ffmpeg is required for benchmark. Install with: brew install ffmpeg")
    process.exit(1)
  }
}

/**
 * Get chip name from system
 */
function getChipName(): string {
  try {
    const output = execSync("sysctl -n machdep.cpu.brand_string", { encoding: "utf-8" })
    return output.trim()
  } catch {
    return "Unknown"
  }
}

async function runBenchmark(): Promise<void> {
  if (!isAvailable()) {
    console.error("Benchmark requires macOS with Apple Silicon")
    process.exit(1)
  }

  if (!isModelDownloaded()) {
    console.error("Model not downloaded. Run: npx whisper-coreml download")
    process.exit(1)
  }

  // Find the benchmark audio file
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const possiblePaths = [
    join(__dirname, "../test/fixtures/brian.ogg"),
    join(__dirname, "../../test/fixtures/brian.ogg"),
    join(process.cwd(), "test/fixtures/brian.ogg")
  ]

  const audioPath = possiblePaths.find((p) => existsSync(p))

  if (!audioPath) {
    console.error("Benchmark audio not found. Clone the repository to run benchmarks:")
    console.error("  git clone https://github.com/sebastian-software/whisper-coreml")
    console.error("  cd whisper-coreml && pnpm install && pnpm benchmark")
    process.exit(1)
  }

  console.log("Whisper CoreML Benchmark")
  console.log("========================\n")

  const chip = getChipName()
  console.log(`Chip: ${chip}`)
  console.log(`Model: ${WHISPER_MODEL.name}`)
  console.log(`Node: ${process.version}\n`)

  // Load audio
  console.log("Loading audio...")
  const samples = loadAudio(audioPath)
  const audioDuration = samples.length / 16000

  console.log(`Audio: ${audioDuration.toFixed(1)}s (${samples.length.toLocaleString()} samples)\n`)

  // Initialize engine
  console.log("Initializing engine...")
  const modelPath = getModelPath()
  const engine = new WhisperAsrEngine({ modelPath })

  const initStart = performance.now()
  await engine.initialize()
  const initTime = performance.now() - initStart

  console.log(`Init time: ${(initTime / 1000).toFixed(2)}s\n`)

  // Warm-up run
  console.log("Warm-up run...")
  await engine.transcribe(samples.slice(0, 16000 * 5), 16000) // 5 seconds

  // Benchmark runs
  const runs = 3
  console.log(`\nBenchmark (${String(runs)} runs)...\n`)

  const times: number[] = []

  for (let i = 0; i < runs; i++) {
    const result = await engine.transcribe(samples, 16000)
    times.push(result.durationMs)
    console.log(`  Run ${String(i + 1)}: ${(result.durationMs / 1000).toFixed(3)}s`)
  }

  engine.cleanup()

  // Calculate stats
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const rtf = avgTime / 1000 / audioDuration
  const speedup = 1 / rtf

  console.log("\n─────────────────────────────")
  console.log("Results")
  console.log("─────────────────────────────")
  console.log(`Audio duration:    ${audioDuration.toFixed(1)}s`)
  console.log(`Avg process time:  ${(avgTime / 1000).toFixed(3)}s`)
  console.log(`Real-time factor:  ${rtf.toFixed(4)}x`)
  console.log(`Speed:             ${speedup.toFixed(0)}x real-time`)
  console.log("")
  console.log(`→ 1 hour of audio in ~${(3600 / speedup).toFixed(0)} seconds`)
  console.log("─────────────────────────────\n")
}

async function main(): Promise<void> {
  if (!command || command === "--help" || command === "-h") {
    printHelp()
    process.exit(0)
  }

  switch (command) {
    case "download": {
      const force = args.includes("--force")
      console.log("Whisper CoreML Model Downloader")
      console.log("===============================\n")

      try {
        // Download main model (.bin)
        console.log("Step 1/2: Downloading Whisper model...")
        await downloadModel({ force })

        // Download CoreML encoder (.mlmodelc)
        console.log("\nStep 2/2: Downloading CoreML encoder...")
        await downloadCoreMLModel({ force })

        console.log("\n✓ All models ready!")
      } catch (error) {
        console.error("\n✗ Download failed:", error instanceof Error ? error.message : error)
        process.exit(1)
      }
      break
    }

    case "benchmark": {
      await runBenchmark()
      break
    }

    case "status": {
      const binDownloaded = isBinModelDownloaded()
      const coremlDownloaded = isCoreMLModelDownloaded()
      const allReady = isModelDownloaded()

      console.log("Whisper CoreML Status")
      console.log("=====================")
      console.log(`Model directory: ${getDefaultModelDir()}`)
      console.log("")

      // Bin model status
      if (binDownloaded) {
        console.log(`✓ ${WHISPER_MODEL.name}.bin (${WHISPER_MODEL.size})`)
      } else {
        console.log(`✗ ${WHISPER_MODEL.name}.bin - Not downloaded`)
      }

      // CoreML model status
      if (coremlDownloaded) {
        console.log(`✓ ${WHISPER_MODEL.name}-encoder.mlmodelc`)
      } else {
        console.log(`✗ ${WHISPER_MODEL.name}-encoder.mlmodelc - Not downloaded`)
      }

      console.log("")
      if (allReady) {
        console.log("✓ All models ready!")
      } else {
        console.log("Run: npx whisper-coreml download")
      }
      break
    }

    case "path": {
      console.log(getDefaultModelDir())
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      printHelp()
      process.exit(1)
  }
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
