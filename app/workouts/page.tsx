"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { WorkoutTable } from "@/components/workouts/workout-table";
import { VoiceInput } from "@/components/workouts/voice-input";
import { WorkoutModal } from "@/components/workouts/workout-modal";
import { useToast } from "@/hooks/use-toast";
import {
  transcribeAudio,
  parseWorkoutText,
  saveWorkout,
  getWorkouts,
} from "@/lib/actions/workout-actions";
import PageTitle from "@/components/page-title";

// types you expect from server actions
type TranscribeResult =
  | { success: true; text: string }
  | { success: false; error: string };

type ParseWorkoutResult =
  | { success: true; workout: ParsedWorkout }
  | { success: false; error: string };

// type guards
function isOkTranscription(r: any): r is { success: true; text: string } {
  return r && r.success === true && typeof r.text === "string";
}
function isOkParsedWorkout(
  r: any
): r is { success: true; workout: ParsedWorkout } {
  return r && r.success === true && r.workout;
}

interface ParsedWorkout {
  name: string;
  duration?: number;
  exercises: Array<{
    name: string;
    category: "strength" | "cardio" | "flexibility" | "other";
    sets: Array<{
      reps?: number;
      weight?: number;
      duration?: number;
      distance?: number;
      restTime?: number;
    }>;
  }>;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const result = await getWorkouts();
    if (result.success) {
      setWorkouts(result.workouts || []);
    }
  };

  const handleVoiceInput = async (input: string, isVoice: boolean) => {
    setIsProcessing(true);
    setIsModalOpen(true);
    setParsedWorkout(null);

    try {
      console.log("Processing input:", input, "Is voice:", isVoice);
      let textToProcess: string = input ?? ""; // ✅ initialize as string

      if (isVoice) {
        const transcriptionResult = (await transcribeAudio(
          input
        )) as TranscribeResult;

        if (
          !isOkTranscription(transcriptionResult) ||
          !transcriptionResult.text.trim()
        ) {
          throw new Error(
            ("error" in transcriptionResult && transcriptionResult.error) ||
              "Empty transcript"
          );
        }

        textToProcess = transcriptionResult.text;

        toast({
          title: "Audio Transcribed",
          description: `"${textToProcess}"`,
        });
      }

      const parseResult = (await parseWorkoutText(
        textToProcess
      )) as ParseWorkoutResult;

      if (!isOkParsedWorkout(parseResult)) {
        // Keep modal closed if parsing failed
        setIsModalOpen(false);
        throw new Error(
          ("error" in parseResult && parseResult.error) ||
            "Invalid workout data"
        );
      }

      setParsedWorkout(parseResult.workout);
    } catch (error) {
      console.error("Error processing input:", error);
      toast({
        title: "Processing Error",
        description:
          error instanceof Error ? error.message : "Failed to process workout",
        variant: "destructive",
      });
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveWorkout = async (workout: ParsedWorkout) => {
    const result = await saveWorkout(workout);
    if (result.success) {
      toast({
        title: "Workout Saved",
        description: "Your workout has been logged successfully!",
      });
      await loadWorkouts();
    } else {
      toast({
        title: "Save Error",
        description: result.error || "Failed to save workout",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 pb-32">
        <div className="mb-6">
          <PageTitle>Workouts</PageTitle>
          <p className="text-muted-foreground">
            Track and log your training sessions.
          </p>
        </div>

        <WorkoutTable workouts={workouts} />

        <WorkoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workoutData={parsedWorkout}
          onSave={handleSaveWorkout}
          isLoading={isProcessing}
        />
      </div>

      <VoiceInput
        onSubmit={handleVoiceInput}
        placeholder="Describe your workout... "
      />
    </AppLayout>
  );
}
