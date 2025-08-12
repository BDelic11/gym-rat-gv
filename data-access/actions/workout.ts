"use server";

import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  normalizeParsedWorkout,
  emptyFallbackWorkout,
  workoutSchemaForLLM,
  ParsedWorkout,
} from "@/schemas/workout";

type Ok<T> = { success: true } & T;
type Fail = { success: false; error: string };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Real user helper (no recursion)
async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * 1) TRANSCRIBE — accepts a File or a base64/dataURL string (VoiceInput sends base64)
 */
export async function transcribeAudio(
  input: File | string
): Promise<Ok<{ text: string }> | Fail> {
  try {
    let file: File;

    if (typeof input === "string") {
      const m = input.match(/^data:audio\/[\w+.-]+;base64,(.+)$/);
      const b64 = m ? m[1] : input;
      const buf = Buffer.from(b64, "base64");
      file = new File([buf], "audio.webm", { type: "audio/webm" });
    } else {
      const buf = Buffer.from(await input.arrayBuffer());
      file = new File([buf], input.name || "audio.webm", {
        type: input.type || "audio/webm",
      });
    }

    const res = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      // language: "hr", // uncomment to force Croatian
      // response_format: "text",
      temperature: 0,
    });

    const text = (res as any).text?.trim?.() ?? "";
    if (!text) return { success: false, error: "Empty transcript" };

    return { success: true, text };
  } catch (e: any) {
    console.error("transcribeAudio error:", e);
    return { success: false, error: e?.message || "Transcription failed" };
  }
}

/**
 * 2) PARSE — tolerant; instructs model to OMIT unknown numeric keys; normalizes/validates
 */
export async function parseWorkoutText(
  text: string
): Promise<Ok<{ workout: ParsedWorkout }> | Fail> {
  try {
    if (!text?.trim()) return { success: false, error: "No text provided" };

    const system = `
Return ONLY JSON matching this shape:
${JSON.stringify(workoutSchemaForLLM, null, 2)}

Rules:
- Input can be Croatian or English.
- If a numeric field is unknown, OMIT THE KEY (do NOT return null).
- If sets/reps are not mentioned, you may omit "sets".
- Prefer "strength" unless it's clearly cardio/flexibility.
- If you infer a date, use "YYYY-MM-DD".
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      // Ask for strict JSON back:
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const raw = resp.choices[0]?.message?.content?.trim() || "";
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.warn("LLM did not return valid JSON. Fallback used.", err);
      return { success: true, workout: emptyFallbackWorkout(text) };
    }

    //  Clean + validate (converts null -> undefined, applies Zod, fills defaults)
    const normalized = normalizeParsedWorkout(json);

    return { success: true, workout: normalized as ParsedWorkout };
  } catch (e: any) {
    console.error("parseWorkoutText error:", e);
    return { success: false, error: e?.message || "Parsing failed" };
  }
}

/**
 * 3) SAVE — maps ParsedWorkout to your Prisma models
 */
export async function saveWorkout(
  workout: ParsedWorkout
): Promise<Ok<{ id: string }> | Fail> {
  try {
    const userId = await getCurrentUserId();

    const dateISO =
      workout.date && /^\d{4}-\d{2}-\d{2}$/.test(workout.date)
        ? new Date(workout.date)
        : new Date();

    const created = await prisma.workout.create({
      data: {
        userId,
        name: workout.name || "Workout",
        date: dateISO,
        duration:
          typeof workout.duration === "number" ? workout.duration : null,
        notes: workout.notes || null,
        exercises: {
          create: (workout.exercises ?? []).map((ex, i) => ({
            name: ex.name,
            category: ex.category ?? "strength",
            order: i,
            sets: {
              create: (ex.sets ?? []).map((s, j) => ({
                reps: s.reps ?? null,
                weight: s.weight ?? null,
                duration: s.duration ?? null,
                distance: s.distance ?? null,
                restTime: s.restTime ?? null,
                order: j,
              })),
            },
          })),
        },
      },
    });

    revalidatePath("/workouts");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, id: created.id };
  } catch (e: any) {
    console.error("saveWorkout error:", e);
    return { success: false, error: e?.message || "Save failed" };
  }
}

/**
 * 4) GET — returns { success, workouts } per user
 */
export async function getWorkouts(): Promise<Ok<{ workouts: any[] }> | Fail> {
  try {
    const userId = await getCurrentUserId();
    const workouts = await prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });
    return { success: true, workouts };
  } catch (e: any) {
    console.error("getWorkouts error:", e);
    return { success: false, error: e?.message || "Fetch failed" };
  }
}
