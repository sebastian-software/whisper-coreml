/**
 * whisper-coreml
 *
 * OpenAI Whisper ASR for Node.js with CoreML/ANE acceleration on Apple Silicon.
 * Based on whisper.cpp with Apple Neural Engine support.
 *
 * Uses the large-v3-turbo model exclusively, as it offers the best speed/quality
 * ratio and is the main reason to choose Whisper over Parakeet.
 */

// Dynamic require for loading native addon (works in both ESM and CJS)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bindingsModule = require("bindings") as (name: string) => unknown

/**
 * Native addon interface
 */
interface NativeAddon {
  initialize(options: {
    modelPath: string
    language?: string
    threads?: number
    useGpu?: boolean
  }): boolean
  isInitialized(): boolean
  transcribe(samples: Float32Array, sampleRate: number): NativeTranscriptionResult
  cleanup(): void
  getVersion(): { addon: string; whisper: string; coreml: string }
}

interface NativeTranscriptionResult {
  text: string
  language: string
  durationMs: number
  segments: {
    startMs: number
    endMs: number
    text: string
    confidence: number
  }[]
}

/* v8 ignore start - platform checks and native addon loading */

/**
 * Load the native addon
 */
function loadAddon(): NativeAddon {
  if (process.platform !== "darwin") {
    throw new Error("whisper-coreml is only supported on macOS")
  }

  try {
    return bindingsModule("whisper_asr") as NativeAddon
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to load Whisper ASR native addon: ${message}`)
  }
}

/* v8 ignore stop */

let addon: NativeAddon | null = null
let loadError: Error | null = null

function getAddon(): NativeAddon {
  if (!addon) {
    try {
      addon = loadAddon()
    } catch (error) {
      // v8 ignore - error path only reached with corrupted installation
      loadError = error instanceof Error ? error : new Error(String(error))
      throw error
    }
  }
  return addon
}

/**
 * Check if Whisper ASR is available on this platform
 */
export function isAvailable(): boolean {
  return process.platform === "darwin" && process.arch === "arm64"
}

/**
 * Get the load error if the addon failed to load
 */
export function getLoadError(): Error | null {
  return loadError
}

/**
 * Transcription segment with timestamps
 */
export interface TranscriptionSegment {
  /** Start time in milliseconds */
  startMs: number
  /** End time in milliseconds */
  endMs: number
  /** Transcribed text for this segment */
  text: string
  /** Confidence score (0-1) */
  confidence: number
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  /** Full transcribed text */
  text: string
  /** Detected or specified language (ISO code) */
  language: string
  /** Processing time in milliseconds */
  durationMs: number
  /** Individual segments with timestamps */
  segments: TranscriptionSegment[]
}

/**
 * Whisper ASR engine options
 */
export interface WhisperAsrOptions {
  /** Path to the Whisper model file (ggml format) */
  modelPath: string
  /** Language code (e.g., "en", "de", "fr") or "auto" for auto-detection */
  language?: string
  /** Number of threads (0 = auto) */
  threads?: number
  /** Use GPU/CoreML acceleration (default: true) */
  useGpu?: boolean
}

/**
 * Whisper ASR Engine with CoreML acceleration
 *
 * Uses the large-v3-turbo model for best speed/quality balance.
 *
 * @example
 * ```typescript
 * import { WhisperAsrEngine, getModelPath } from "whisper-coreml"
 *
 * const engine = new WhisperAsrEngine({
 *   modelPath: getModelPath()
 * })
 *
 * await engine.initialize()
 * const result = await engine.transcribe(audioSamples, 16000)
 * console.log(result.text)
 * ```
 */
export class WhisperAsrEngine {
  private options: WhisperAsrOptions
  private initialized = false

  constructor(options: WhisperAsrOptions) {
    this.options = options
  }

  /* v8 ignore start - native addon calls, tested via E2E */

  /**
   * Initialize the Whisper engine
   * This loads the model into memory - may take a few seconds.
   */
  initialize(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve()
    }

    const nativeAddon = getAddon()
    const success = nativeAddon.initialize({
      modelPath: this.options.modelPath,
      language: this.options.language ?? "auto",
      threads: this.options.threads ?? 0,
      useGpu: this.options.useGpu ?? true
    })

    if (!success) {
      return Promise.reject(new Error("Failed to initialize Whisper engine"))
    }

    this.initialized = true
    return Promise.resolve()
  }

  /**
   * Check if the engine is ready for transcription
   */
  isReady(): boolean {
    if (!this.initialized) {
      return false
    }
    try {
      return getAddon().isInitialized()
    } catch {
      return false
    }
  }

  /**
   * Transcribe audio samples
   *
   * @param samples - Float32Array of audio samples (mono, 16kHz)
   * @param sampleRate - Sample rate in Hz (default: 16000)
   * @returns Transcription result with text and segments
   */
  transcribe(samples: Float32Array, sampleRate = 16000): Promise<TranscriptionResult> {
    if (!this.initialized) {
      return Promise.reject(new Error("Whisper engine not initialized. Call initialize() first."))
    }

    const result = getAddon().transcribe(samples, sampleRate)

    return Promise.resolve({
      text: result.text,
      language: result.language,
      durationMs: result.durationMs,
      segments: result.segments
    })
  }

  /**
   * Clean up resources and unload the model
   */
  cleanup(): void {
    if (this.initialized) {
      try {
        getAddon().cleanup()
      } catch {
        // Ignore cleanup errors
      }
      this.initialized = false
    }
  }

  /**
   * Get version information
   */
  getVersion(): { addon: string; whisper: string; coreml: string } {
    return getAddon().getVersion()
  }

  /* v8 ignore stop */
}

/**
 * All language codes supported by Whisper large-v3-turbo.
 * Sorted alphabetically by language code.
 */
export const SUPPORTED_LANGUAGES = [
  "af", // Afrikaans
  "am", // Amharic
  "ar", // Arabic
  "as", // Assamese
  "az", // Azerbaijani
  "ba", // Bashkir
  "be", // Belarusian
  "bg", // Bulgarian
  "bn", // Bengali
  "bo", // Tibetan
  "br", // Breton
  "bs", // Bosnian
  "ca", // Catalan
  "cs", // Czech
  "cy", // Welsh
  "da", // Danish
  "de", // German
  "el", // Greek
  "en", // English
  "es", // Spanish
  "et", // Estonian
  "eu", // Basque
  "fa", // Persian
  "fi", // Finnish
  "fo", // Faroese
  "fr", // French
  "gl", // Galician
  "gu", // Gujarati
  "ha", // Hausa
  "haw", // Hawaiian
  "he", // Hebrew
  "hi", // Hindi
  "hr", // Croatian
  "ht", // Haitian Creole
  "hu", // Hungarian
  "hy", // Armenian
  "id", // Indonesian
  "is", // Icelandic
  "it", // Italian
  "ja", // Japanese
  "jw", // Javanese
  "ka", // Georgian
  "kk", // Kazakh
  "km", // Khmer
  "kn", // Kannada
  "ko", // Korean
  "la", // Latin
  "lb", // Luxembourgish
  "ln", // Lingala
  "lo", // Lao
  "lt", // Lithuanian
  "lv", // Latvian
  "mg", // Malagasy
  "mi", // Maori
  "mk", // Macedonian
  "ml", // Malayalam
  "mn", // Mongolian
  "mr", // Marathi
  "ms", // Malay
  "mt", // Maltese
  "my", // Myanmar
  "ne", // Nepali
  "nl", // Dutch
  "nn", // Nynorsk
  "no", // Norwegian
  "oc", // Occitan
  "pa", // Punjabi
  "pl", // Polish
  "ps", // Pashto
  "pt", // Portuguese
  "ro", // Romanian
  "ru", // Russian
  "sa", // Sanskrit
  "sd", // Sindhi
  "si", // Sinhala
  "sk", // Slovak
  "sl", // Slovenian
  "sn", // Shona
  "so", // Somali
  "sq", // Albanian
  "sr", // Serbian
  "su", // Sundanese
  "sv", // Swedish
  "sw", // Swahili
  "ta", // Tamil
  "te", // Telugu
  "tg", // Tajik
  "th", // Thai
  "tk", // Turkmen
  "tl", // Tagalog
  "tr", // Turkish
  "tt", // Tatar
  "uk", // Ukrainian
  "ur", // Urdu
  "uz", // Uzbek
  "vi", // Vietnamese
  "yi", // Yiddish
  "yo", // Yoruba
  "yue", // Cantonese
  "zh" // Chinese
] as const

/**
 * Supported language code type.
 * Union of all language codes supported by the Whisper large-v3-turbo model.
 */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// Re-export download utilities
export {
  downloadModel,
  downloadCoreMLModel,
  formatBytes,
  getDefaultModelDir,
  getModelPath,
  getCoreMLModelPath,
  isModelDownloaded,
  isBinModelDownloaded,
  isCoreMLModelDownloaded,
  WHISPER_MODEL,
  type DownloadOptions
} from "./download.js"
