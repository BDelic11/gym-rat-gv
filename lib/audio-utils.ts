export class AudioProcessor {
  private static instance: AudioProcessor;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  static getInstance() {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor();
    }
    return AudioProcessor.instance;
  }

  async startRecording(): Promise<
    { success: true } | { success: false; error: string }
  > {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      this.mediaRecorder.ondataavailable = (e) =>
        e.data.size && this.chunks.push(e.data);
      this.mediaRecorder.start();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Mic permission denied" };
    }
  }

  async stopRecording(): Promise<
    { success: true; audioBlob: Blob } | { success: false; error: string }
  > {
    return new Promise((resolve) => {
      if (!this.mediaRecorder)
        return resolve({ success: false, error: "No recorder" });

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        resolve({ success: true, audioBlob: blob });
      };
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      this.mediaRecorder = null;
    });
  }

  static validateAudioBlob(
    blob: Blob
  ): { valid: true } | { valid: false; error: string } {
    const maxSizeMB = 20;
    if (blob.size === 0) return { valid: false, error: "Empty audio" };
    if (blob.size > maxSizeMB * 1024 * 1024)
      return { valid: false, error: "Audio too large" };
    return { valid: true };
  }

  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob); // data:image/..;base64,...
    });
  }
}
