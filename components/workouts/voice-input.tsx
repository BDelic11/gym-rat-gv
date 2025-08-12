"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioProcessor } from "@/lib/audio-utils";

interface VoiceInputProps {
  onSubmit: (input: string, isVoice: boolean) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function VoiceInput({
  onSubmit,
  placeholder = "Describe your workout...",
  disabled,
}: VoiceInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const audioProcessor = useRef(AudioProcessor.getInstance());
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const result = await audioProcessor.current.startRecording();

      if (!result.success) {
        toast({
          title: "Recording Error",
          description: result.error || "Could not start recording",
          variant: "destructive",
        });
        return;
      }

      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop after 5 minutes to prevent huge files
          if (newDuration >= 300) {
            stopRecording();
            return prev;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      const result = await audioProcessor.current.stopRecording();

      if (!result.success || !result.audioBlob) {
        toast({
          title: "Recording Error",
          description: !result.success
            ? result.error
            : "Failed to process recording",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Validate audio
      const validation = AudioProcessor.validateAudioBlob(result.audioBlob);
      if (!validation.valid) {
        toast({
          title: "Invalid Audio",
          description: validation.error,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Convert to base64 and submit
      const base64Audio = await AudioProcessor.blobToBase64(result.audioBlob);
      await onSubmit(base64Audio, true);
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  }, [onSubmit, toast]);

  const handleTextSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      await onSubmit(input.trim(), false);
      setInput("");
    } catch (error) {
      console.error("Error submitting text:", error);
      toast({
        title: "Submission Error",
        description: "Failed to process input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:left-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1 ">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              placeholder={placeholder}
              disabled={disabled || isProcessing || isRecording}
              className="min-h-[44px] text-md max-h-32 resize-non rounded-full md:rounded-md"
              rows={1}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isProcessing}
              className="h-11 w-11 rounded-full md:rounded-md"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={handleTextSubmit}
              disabled={
                disabled || isProcessing || !input.trim() || isRecording
              }
              className="h-11 w-11 rounded-full md:rounded-md"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Recording status */}
        {isRecording && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording... {formatDuration(recordingDuration)}
            </div>
            <div className="text-muted-foreground">
              Click microphone to stop
            </div>
          </div>
        )}

        {/* Processing status */}
        {isProcessing && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing audio...
          </div>
        )}

        {/* Recording duration warning */}
        {isRecording && recordingDuration > 240 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Recording will auto-stop at 5 minutes
          </div>
        )}
      </div>
    </div>
  );
}
