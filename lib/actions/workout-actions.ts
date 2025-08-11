"use server"

import { prisma } from "@/lib/prisma"
import { openai, workoutSchema } from "@/lib/openai"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const DEMO_USER_ID = "demo-user-id"

// Zod schema for workout validation
const WorkoutValidationSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  duration: z.number().optional(),
  exercises: z.array(
    z.object({
      name: z.string().min(1, "Exercise name is required"),
      category: z.enum(["strength", "cardio", "flexibility", "other"]),
      sets: z.array(
        z.object({
          reps: z.number().optional(),
          weight: z.number().optional(),
          duration: z.number().optional(),
          distance: z.number().optional(),
          restTime: z.number().optional(),
        }),
      ),
    }),
  ),
})

export async function transcribeAudio(audioBase64: string) {
  try {
    // Validate input
    if (!audioBase64) {
      return { success: false, error: "No audio data provided" }
    }

    // Remove data URL prefix if present
    const base64Audio = audioBase64.replace(/^data:audio\/[^;]+;base64,/, "")

    // Validate base64 format
    if (!base64Audio || base64Audio.length < 100) {
      return { success: false, error: "Invalid audio data" }
    }

    // Convert base64 to buffer
    let audioBuffer: Buffer
    try {
      audioBuffer = Buffer.from(base64Audio, "base64")
    } catch (error) {
      return { success: false, error: "Failed to decode audio data" }
    }

    // Validate buffer size
    if (audioBuffer.length === 0) {
      return { success: false, error: "Empty audio data" }
    }

    if (audioBuffer.length > 25 * 1024 * 1024) {
      // 25MB limit
      return { success: false, error: "Audio file too large (max 25MB)" }
    }

    // Determine file type and create appropriate File object
    let mimeType = "audio/webm"
    let fileName = "audio.webm"

    // Try to detect format from the original data URL
    const dataUrlMatch = audioBase64.match(/^data:audio\/([^;]+);base64,/)
    if (dataUrlMatch) {
      const detectedType = dataUrlMatch[1]
      mimeType = `audio/${detectedType}`
      fileName = `audio.${detectedType === "mpeg" ? "mp3" : detectedType}`
    }

    const audioFile = new File([audioBuffer], fileName, { type: mimeType })

    // Transcribe with retry logic
    let lastError: Error | null = null
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en", // Can be made configurable
          response_format: "text",
          temperature: 0.2, // Lower temperature for more consistent results
        })

        // Validate transcription result
        if (!transcription || typeof transcription !== "string" || transcription.trim().length === 0) {
          return { success: false, error: "No speech detected in audio" }
        }

        return { success: true, text: transcription.trim() }
      } catch (error) {
        lastError = error as Error
        console.error(`Transcription attempt ${attempt + 1} failed:`, error)

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (
            error.message.includes("Invalid file format") ||
            error.message.includes("File too large") ||
            error.message.includes("quota")
          ) {
            break
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Failed to transcribe audio after multiple attempts",
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to transcribe audio",
    }
  }
}

export async function parseWorkoutText(text: string) {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      return { success: false, error: "No text provided to parse" }
    }

    if (text.length > 4000) {
      // Reasonable limit
      return { success: false, error: "Text too long to process" }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a fitness expert AI that parses workout descriptions into structured data. 
          Parse the user's workout description and return a JSON object matching this schema:
          ${JSON.stringify(workoutSchema, null, 2)}
          
          Guidelines:
          - Infer reasonable values for missing information
          - For strength exercises, estimate weight based on common ranges for average adults
          - For cardio, estimate duration and distance if mentioned
          - Categorize exercises as: strength, cardio, flexibility, or other
          - If no workout name is provided, create a descriptive one based on the exercises
          - Estimate rest time between sets (typically 60-180 seconds for strength, 30-60 for cardio)
          - If sets/reps aren't specified, use reasonable defaults (3 sets of 8-12 reps for strength)
          - Always include at least one exercise with at least one set
          - Be conservative with weight estimates - better to underestimate than overestimate`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent parsing
      max_tokens: 2000,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return { success: false, error: "No response from AI parser" }
    }

    let parsedWorkout
    try {
      parsedWorkout = JSON.parse(content)
    } catch (error) {
      console.error("JSON parsing error:", error)
      return { success: false, error: "Invalid response format from AI parser" }
    }

    // Validate the parsed workout
    const validatedWorkout = WorkoutValidationSchema.parse(parsedWorkout)

    // Additional validation
    if (validatedWorkout.exercises.length === 0) {
      return { success: false, error: "No exercises found in workout description" }
    }

    return { success: true, workout: validatedWorkout }
  } catch (error) {
    console.error("Workout parsing error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid workout data: ${error.errors.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse workout description",
    }
  }
}

export async function saveWorkout(workoutData: z.infer<typeof WorkoutValidationSchema>) {
  try {
    // Calculate estimated calories burned
    const estimatedCalories = estimateCaloriesBurned(workoutData)

    const workout = await prisma.workout.create({
      data: {
        userId: DEMO_USER_ID,
        name: workoutData.name,
        duration: workoutData.duration,
        caloriesBurned: estimatedCalories,
        date: new Date(),
        exercises: {
          create: workoutData.exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name,
            category: exercise.category,
            order: exerciseIndex + 1,
            sets: {
              create: exercise.sets.map((set, setIndex) => ({
                reps: set.reps,
                weight: set.weight,
                duration: set.duration,
                distance: set.distance,
                restTime: set.restTime,
                order: setIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })

    revalidatePath("/workouts")
    revalidatePath("/")

    return { success: true, workout }
  } catch (error) {
    console.error("Save workout error:", error)
    return { success: false, error: "Failed to save workout" }
  }
}

function estimateCaloriesBurned(workoutData: z.infer<typeof WorkoutValidationSchema>): number {
  let totalCalories = 0
  const duration = workoutData.duration || 60 // Default 60 minutes if not specified

  for (const exercise of workoutData.exercises) {
    switch (exercise.category) {
      case "strength":
        // Estimate 5-8 calories per minute for strength training
        totalCalories += duration * 6
        break
      case "cardio":
        // Estimate 8-12 calories per minute for cardio
        totalCalories += duration * 10
        break
      case "flexibility":
        // Estimate 2-4 calories per minute for flexibility
        totalCalories += duration * 3
        break
      default:
        // General estimate
        totalCalories += duration * 5
        break
    }
  }

  // Average across exercises and apply reasonable bounds
  const avgCalories = Math.round(totalCalories / workoutData.exercises.length)
  return Math.min(Math.max(avgCalories, 50), 800) // Between 50-800 calories
}

export async function getWorkouts() {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: DEMO_USER_ID },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { date: "desc" },
    })

    return { success: true, workouts }
  } catch (error) {
    console.error("Get workouts error:", error)
    return { success: false, error: "Failed to fetch workouts" }
  }
}
