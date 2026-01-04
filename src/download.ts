/**
 * Model download functionality for whisper-coreml
 *
 * Note: We only support large-v3-turbo as it's the only Whisper model
 * that offers better quality than Parakeet while maintaining reasonable speed.
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"

/**
 * Whisper large-v3-turbo model info
 * This is the only model we support as it offers the best speed/quality ratio
 * and is the main reason to choose Whisper over Parakeet.
 */
export const WHISPER_MODEL = {
  name: "large-v3-turbo",
  size: "1.5 GB",
  languages: "99 languages",
  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
} as const

/**
 * CoreML encoder model info - required for GPU acceleration
 */
const COREML_REPO = "sebastian-software/whisper-coreml-models"
const COREML_API = `https://huggingface.co/api/models/${COREML_REPO}`
const COREML_DOWNLOAD = `https://huggingface.co/${COREML_REPO}/resolve/main`
const COREML_MODEL_NAME = "ggml-large-v3-turbo-encoder.mlmodelc"

/**
 * Default model directory in user's cache
 */
export function getDefaultModelDir(): string {
  return join(homedir(), ".cache", "whisper-coreml", "models")
}

/**
 * Get the path to the model
 */
export function getModelPath(modelDir?: string): string {
  const dir = modelDir ?? getDefaultModelDir()
  return join(dir, `ggml-${WHISPER_MODEL.name}.bin`)
}

/**
 * Get path to the CoreML encoder model
 */
export function getCoreMLModelPath(modelDir?: string): string {
  const dir = modelDir ?? getDefaultModelDir()
  return join(dir, COREML_MODEL_NAME)
}

/**
 * Check if the model is downloaded (both .bin and .mlmodelc)
 */
export function isModelDownloaded(modelDir?: string): boolean {
  const modelPath = getModelPath(modelDir)
  const coremlPath = getCoreMLModelPath(modelDir)
  return existsSync(modelPath) && existsSync(coremlPath)
}

/**
 * Check if only the bin model is downloaded (for partial downloads)
 */
export function isBinModelDownloaded(modelDir?: string): boolean {
  const modelPath = getModelPath(modelDir)
  return existsSync(modelPath)
}

/**
 * Check if CoreML model is downloaded
 */
export function isCoreMLModelDownloaded(modelDir?: string): boolean {
  const coremlPath = getCoreMLModelPath(modelDir)
  return existsSync(coremlPath)
}

interface DownloadProgress {
  downloadedBytes: number
  totalBytes: number
  percent: number
}

export interface DownloadOptions {
  /** Target directory for model (default: ~/.cache/whisper-coreml/models) */
  modelDir?: string

  /** Progress callback */
  onProgress?: (progress: DownloadProgress) => void

  /** Force re-download even if model exists */
  force?: boolean
}

/* v8 ignore start - network I/O */

/**
 * Download the Whisper large-v3-turbo model from Hugging Face
 */
export async function downloadModel(options: DownloadOptions = {}): Promise<string> {
  const modelDir = options.modelDir ?? getDefaultModelDir()
  const modelPath = getModelPath(modelDir)

  if (!options.force && existsSync(modelPath)) {
    return modelPath
  }

  // Clean up partial downloads
  if (existsSync(modelPath)) {
    rmSync(modelPath)
  }

  mkdirSync(dirname(modelPath), { recursive: true })

  console.log(`Downloading Whisper ${WHISPER_MODEL.name} (${WHISPER_MODEL.size})...`)
  console.log(`Source: ${WHISPER_MODEL.url}`)
  console.log(`Target: ${modelPath}`)

  const response = await fetch(WHISPER_MODEL.url)
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`)
  }

  const contentLength = response.headers.get("content-length")
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Failed to get response body reader")
  }

  const chunks: Uint8Array[] = []
  let downloadedBytes = 0

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const result = await reader.read()
    if (result.done) {
      break
    }

    const chunk = result.value as Uint8Array
    chunks.push(chunk)
    downloadedBytes += chunk.length

    const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0

    if (options.onProgress) {
      options.onProgress({
        downloadedBytes,
        totalBytes,
        percent
      })
    }

    // Progress indicator
    process.stdout.write(
      `\rProgress: ${String(percent)}% (${formatBytes(downloadedBytes)}/${formatBytes(totalBytes)})`
    )
  }

  // Combine chunks and write to file
  const buffer = Buffer.concat(chunks)
  writeFileSync(modelPath, buffer)

  console.log("\n✓ Model downloaded successfully!")
  return modelPath
}

/* v8 ignore stop */

interface TreeEntry {
  type: "file" | "directory"
  path: string
  size?: number
}

/* v8 ignore start - network I/O */

/**
 * Fetch file tree from Hugging Face
 */
async function fetchFileTree(path = ""): Promise<TreeEntry[]> {
  const url = `${COREML_API}/tree/main${path ? `/${path}` : ""}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch file tree: ${response.statusText}`)
  }

  return (await response.json()) as TreeEntry[]
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(path = ""): Promise<TreeEntry[]> {
  const entries = await fetchFileTree(path)
  const files: TreeEntry[] = []

  for (const entry of entries) {
    if (entry.type === "file") {
      files.push(entry)
    } else {
      const subFiles = await getAllFiles(entry.path)
      files.push(...subFiles)
    }
  }

  return files
}

/**
 * Download a single file from Hugging Face
 */
async function downloadFile(filePath: string, destDir: string): Promise<void> {
  const url = `${COREML_DOWNLOAD}/${filePath}`
  const destPath = join(destDir, filePath)
  const destDirPath = dirname(destPath)

  mkdirSync(destDirPath, { recursive: true })

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${filePath}: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  writeFileSync(destPath, Buffer.from(buffer))
}

/**
 * Download the CoreML encoder model from Hugging Face
 */
export async function downloadCoreMLModel(options: DownloadOptions = {}): Promise<string> {
  const modelDir = options.modelDir ?? getDefaultModelDir()
  const coremlPath = getCoreMLModelPath(modelDir)

  if (!options.force && existsSync(coremlPath)) {
    return coremlPath
  }

  // Clean up partial downloads
  if (existsSync(coremlPath)) {
    rmSync(coremlPath, { recursive: true })
  }
  mkdirSync(modelDir, { recursive: true })

  console.log("Fetching CoreML model file list from Hugging Face...")
  const files = await getAllFiles(COREML_MODEL_NAME)

  const totalSize = files.reduce((acc, f) => acc + (f.size ?? 0), 0)
  const totalCount = files.length

  console.log(
    `Downloading CoreML encoder (${String(totalCount)} files, ${formatBytes(totalSize)})...`
  )

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) {
      continue
    }

    await downloadFile(file.path, modelDir)

    const current = i + 1
    const percent = Math.round((current / totalCount) * 100)

    if (options.onProgress) {
      options.onProgress({
        downloadedBytes: current,
        totalBytes: totalCount,
        percent
      })
    }

    process.stdout.write(
      `\rProgress: ${String(percent)}% (${String(current)}/${String(totalCount)} files)`
    )
  }

  console.log("\n✓ CoreML model downloaded successfully!")
  return coremlPath
}

/* v8 ignore stop */

/**
 * Format bytes to human readable string
 * @internal Exported for testing
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
