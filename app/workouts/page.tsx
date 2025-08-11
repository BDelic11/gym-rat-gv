"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { WorkoutTable } from "@/components/workouts/workout-table"
import { VoiceInput } from "@/components/workouts/voice-input"
import { WorkoutModal } from "@/components/workouts/workout-modal"
import { useToast } from "@/hooks/use-toast"
import { transcribeAudio, parseWorkoutText, saveWorkout, getWorkouts } from "@/lib/actions/workout-actions"

interface ParsedWorkout {
  name: string
  duration?: number
  exercises: Array<{
    name: string
    category: "strength" | "cardio" | "flexibility" | "other"
    sets: Array<{
      reps?: number
      weight?: number
      duration?: number
      distance?: number
      restTime?: number
    }>
  }>
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    const result = await getWorkouts()
    if (result.success) {
      setWorkouts(result.workouts || [])
    }
  }

  const handleVoiceInput = async (input: string, isVoice: boolean) => {
    setIsProcessing(true)
    setIsModalOpen(true)
    setParsedWorkout(null)

    try {
      let textToProcess = input

      if (isVoice) {
        // Transcribe audio first
        const transcriptionResult = await transcribeAudio(input)
        if (!transcriptionResult.success) {
          throw new Error(transcriptionResult.error)
        }
        textToProcess = transcriptionResult.text

        toast({
          title: "Audio Transcribed",
          description: `"${textToProcess}"`,
        })
      }

      // Parse the workout text
      const parseResult = await parseWorkoutText(textToProcess)
      if (!parseResult.success) {
        throw new Error(parseResult.error)
      }

      setParsedWorkout(parseResult.workout)
    } catch (error) {
      console.error("Error processing input:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process workout",
        variant: "destructive",
      })
      setIsModalOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveWorkout = async (workout: ParsedWorkout) => {
    const result = await saveWorkout(workout)
    if (result.success) {
      toast({
        title: "Workout Saved",
        description: "Your workout has been logged successfully!",
      })
      await loadWorkouts()
    } else {
      toast({
        title: "Save Error",
        description: result.error || "Failed to save workout",
        variant: "destructive",
      })
    }
  }

  return (
    <AppLayout>
      <div className="p-6 pb-32">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Track and log your training sessions.</p>
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
        placeholder="Describe your workout... (e.g., 'I did 3 sets of bench press with 80kg for 10 reps each')"
      />
    </AppLayout>
  )
}
