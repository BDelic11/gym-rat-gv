export class AudioProcessor {
  private static instance: AudioProcessor
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  static getInstance(): AudioProcessor {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor()
    }
    return AudioProcessor.instance
  }

  async startRecording(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: "Audio recording not supported in this browser" }
      }

      // Request microphone access with optimal settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Optimal for Whisper
          channelCount: 1, // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Check for MediaRecorder support
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        if (!MediaRecorder.isTypeSupported("audio/mp4")) {
          return { success: false, error: "No supported audio format available" }
        }
      }

      // Create MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4"

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // Good quality for speech
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000) // Collect data every second
      return { success: true }
    } catch (error) {
      console.error("Error starting recording:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start recording",
      }
    }
  }

  async stopRecording(): Promise<{ success: boolean; audioBlob?: Blob; error?: string }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve({ success: false, error: "No active recording" })
        return
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || "audio/webm",
          })

          // Clean up
          this.cleanup()

          // Validate audio blob
          if (audioBlob.size === 0) {
            resolve({ success: false, error: "No audio data recorded" })
            return
          }

          if (audioBlob.size < 1000) {
            // Less than 1KB is probably too short
            resolve({ success: false, error: "Recording too short" })
            return
          }

          resolve({ success: true, audioBlob })
        } catch (error) {
          console.error("Error processing recording:", error)
          resolve({
            success: false,
            error: error instanceof Error ? error.message : "Failed to process recording",
          })
        }
      }

      this.mediaRecorder.stop()
    })
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording"
  }

  // Convert audio blob to base64 for API transmission
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Validate audio format and size
  static validateAudioBlob(blob: Blob): { valid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024 // 25MB limit for OpenAI
    const minSize = 1000 // 1KB minimum

    if (blob.size > maxSize) {
      return { valid: false, error: "Audio file too large (max 25MB)" }
    }

    if (blob.size < minSize) {
      return { valid: false, error: "Audio file too small" }
    }

    // Check if it's a supported audio type
    const supportedTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"]
    if (!supportedTypes.some((type) => blob.type.includes(type.split("/")[1]))) {
      return { valid: false, error: "Unsupported audio format" }
    }

    return { valid: true }
  }
}
