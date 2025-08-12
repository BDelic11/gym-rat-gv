"use server";

import { prisma } from "@/lib/prisma";
import { openai, workoutSchema } from "@/lib/openai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth"; // <-- use your real auth helper

const WorkoutValidationSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  duration: z.number().nullable().optional(),
  exercises: z.array(
    z.object({
      name: z.string().min(1, "Exercise name is required"),
      category: z.enum(["strength", "cardio", "flexibility", "other"]),
      sets: z.array(
        z.object({
          reps: z.number().nullable().optional(),
          weight: z.number().nullable().optional(),
          duration: z.number().nullable().optional(),
          distance: z.number().nullable().optional(),
          restTime: z.number().nullable().optional(),
        })
      ),
    })
  ),
});

// ----------------------- TRANSCRIBE (unchanged auth-wise) -----------------------
export async function transcribeAudio(audioBase64: string) {
  try {
    if (!audioBase64)
      return { success: false, error: "No audio data provided" };

    const base64Audio = audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
    if (!base64Audio || base64Audio.length < 100) {
      return { success: false, error: "Invalid audio data" };
    }

    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(base64Audio, "base64");
    } catch {
      return { success: false, error: "Failed to decode audio data" };
    }
    if (audioBuffer.length === 0)
      return { success: false, error: "Empty audio data" };
    if (audioBuffer.length > 25 * 1024 * 1024)
      return { success: false, error: "Audio file too large (max 25MB)" };

    let mimeType = "audio/webm";
    let fileName = "audio.webm";
    const dataUrlMatch = audioBase64.match(/^data:audio\/([^;]+);base64,/);
    if (dataUrlMatch) {
      const detectedType = dataUrlMatch[1];
      mimeType = `audio/${detectedType}`;
      fileName = `audio.${detectedType === "mpeg" ? "mp3" : detectedType}`;
    }

    const audioFile = new File([audioBuffer], fileName, { type: mimeType });

    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "hr",
          response_format: "text",
          temperature: 0.2,
        });

        if (
          !transcription ||
          typeof transcription !== "string" ||
          transcription.trim().length === 0
        ) {
          return { success: false, error: "No speech detected in audio" };
        }
        return { success: true, text: transcription.trim() };
      } catch (error: any) {
        lastError = error;
        if (
          typeof error?.message === "string" &&
          (error.message.includes("Invalid file format") ||
            error.message.includes("File too large") ||
            error.message.includes("quota"))
        ) {
          break;
        }
        if (attempt < maxRetries)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error:
        lastError?.message ||
        "Failed to transcribe audio after multiple attempts",
    };
  } catch (error: any) {
    console.error("Transcription error:", error);
    return {
      success: false,
      error: error?.message ?? "Failed to transcribe audio",
    };
  }
}

// ----------------------- PARSE WORKOUT (model choice up to you) -----------------------
export async function parseWorkoutText(text: string) {
  try {
    if (!text?.trim())
      return { success: false, error: "No text provided to parse" };
    if (text.length > 4000)
      return { success: false, error: "Text too long to process" };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a fitness expert AI that parses workout descriptions into structured data.
          Return ONLY a JSON object matching this schema:
          ${JSON.stringify(workoutSchema, null, 2)}
          Guidelines:
          - If sets/reps missing: default to 3 sets of 8-12 reps for strength
          - Always include at least one exercise with one set
          - Prefer conservative weight estimates
          - If name missing, infer a descriptive name`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content)
      return { success: false, error: "No response from AI parser" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        success: false,
        error: "Invalid response format from AI parser",
      };
    }

    const validated = WorkoutValidationSchema.parse(parsed);
    if (validated.exercises.length === 0) {
      return {
        success: false,
        error: "No exercises found in workout description",
      };
    }

    return { success: true, workout: validated };
  } catch (error) {
    console.error("Workout parsing error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid workout data: ${error.errors
          .map((e) => e.message)
          .join(", ")}`,
      };
    }
    return {
      success: false,
      error: (error as Error)?.message ?? "Failed to parse workout description",
    };
  }
}

// ----------------------- SAVE WORKOUT (uses real user) -----------------------
export async function saveWorkout(
  workoutData: z.infer<typeof WorkoutValidationSchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const estimatedCalories = estimateCaloriesBurned(workoutData);

    const workout = await prisma.workout.create({
      data: {
        userId: user.id, // ✅ real user
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
        exercises: { include: { sets: true } },
      },
    });

    revalidatePath("/workouts");
    revalidatePath("/");

    return { success: true, workout };
  } catch (error) {
    console.error("Save workout error:", error);
    return { success: false, error: "Failed to save workout" };
  }
}

// ----------------------- GET WORKOUTS (per real user) -----------------------
export async function getWorkouts() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id }, // ✅ real user
      include: {
        exercises: {
          include: {
            sets: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { date: "desc" },
    });

    return { success: true, workouts };
  } catch (error) {
    console.error("Get workouts error:", error);
    return { success: false, error: "Failed to fetch workouts" };
  }
}

// ----------------------- Calories helper -----------------------
function estimateCaloriesBurned(
  workoutData: z.infer<typeof WorkoutValidationSchema>
): number {
  let totalCalories = 0;
  const duration = workoutData.duration || 60;

  for (const exercise of workoutData.exercises) {
    switch (exercise.category) {
      case "strength":
        totalCalories += duration * 6;
        break;
      case "cardio":
        totalCalories += duration * 10;
        break;
      case "flexibility":
        totalCalories += duration * 3;
        break;
      default:
        totalCalories += duration * 5;
        break;
    }
  }

  const avg = Math.round(
    totalCalories / Math.max(workoutData.exercises.length, 1)
  );
  return Math.min(Math.max(avg, 50), 800);
}
