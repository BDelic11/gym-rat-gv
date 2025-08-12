// src/lib/validators/workout.ts
import { z } from "zod";

/**
 * Plain JSON shape for LLM prompts (ne koristi Zod – samo za prikaz u promptu).
 * Ovo samo dokumentira očekivani output modela.
 */
export const workoutSchemaForLLM = {
  date: "YYYY-MM-DD (optional)",
  name: "string (npr. 'Push Day' ili 'Workout')",
  duration: 60, // minutes (optional)
  notes: "string (optional)",
  exercises: [
    {
      name: "string", // npr. "Barbell Bench Press"
      category: "strength", // "strength" | "cardio" | "flexibility" | "other"
      sets: [
        {
          reps: 10, // optional (cardio/flexibility često nema)
          weight: 50, // kg (optional)
          duration: 60, // seconds (optional – plank/interval)
          distance: 1.5, // km (optional – cardio)
          restTime: 90, // seconds (optional)
        },
      ],
    },
  ],
} as const;

/** Today in YYYY-MM-DD (local TZ) */
function todayYYYYMMDD() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** 🔧 Clean all nulls -> undefined so z.optional() passes */
function nullsToUndefined(input: unknown): unknown {
  if (input === null) return undefined;
  if (Array.isArray(input)) return input.map(nullsToUndefined);
  if (typeof input === "object" && input) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) out[k] = nullsToUndefined(v);
    return out;
  }
  return input;
}

const SetZ = z.object({
  reps: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  duration: z.coerce.number().positive().optional().nullable(), // seconds
  distance: z.coerce.number().positive().optional().nullable(), // km
  restTime: z.coerce.number().positive().optional().nullable(), // seconds
});

const ExerciseZ = z.object({
  name: z.string().min(1, "Exercise name is required"),
  category: z
    .enum(["strength", "cardio", "flexibility", "other"])
    .default("strength"),
  notes: z.string().optional(),
  sets: z.array(SetZ).default([]),
});

export const ParsedWorkoutZod = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  name: z.string().min(1, "Workout name is required").default("Workout"),
  duration: z.coerce.number().int().positive().optional().nullable(), // 👈 allow null too
  notes: z.string().optional(),
  exercises: z.array(ExerciseZ).default([]),
});

export type ParsedWorkout = z.infer<typeof ParsedWorkoutZod>;

/** ✅ Normalize + validate */
export function normalizeParsedWorkout(input: unknown): ParsedWorkout {
  // 0) Pre-clean nulls so Zod optional() accepts them
  const cleaned = nullsToUndefined(input);

  // 1) Strict parse with defaults
  let parsed = ParsedWorkoutZod.parse(cleaned ?? {});

  // 2) default date
  if (!parsed.date) parsed = { ...parsed, date: todayYYYYMMDD() };

  // 3) trim names & keep only defined numbers in sets
  const exercises = parsed.exercises.map((ex) => {
    const sets = (ex.sets ?? []).map((s) => ({
      reps: s.reps ?? undefined,
      weight: s.weight ?? undefined,
      duration: s.duration ?? undefined,
      distance: s.distance ?? undefined,
      restTime: s.restTime ?? undefined,
    }));
    return {
      name: ex.name.trim() || "Exercise",
      category: ex.category ?? "strength",
      notes: ex.notes?.trim() || undefined,
      sets,
    };
  });

  return {
    name: parsed.name.trim() || "Workout",
    duration: parsed.duration ?? undefined,
    notes: parsed.notes?.trim() || undefined,
    date: parsed.date,
    exercises,
  };
}

export function emptyFallbackWorkout(notes?: string): ParsedWorkout {
  return {
    name: "Workout",
    duration: undefined,
    notes: notes?.trim() || undefined,
    date: todayYYYYMMDD(),
    exercises: [],
  };
}
