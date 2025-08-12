// lib/nutrition.ts
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "lightly_active"
  | "moderate"
  | "moderately_active"
  | "active"
  | "very_active";

export type Goal = "lose" | "maintain" | "gain";

// Map many possible strings to our canonical Goal
export function normalizeGoal(goal?: string | null): Goal {
  const g = (goal || "").toLowerCase();
  if (
    [
      "lose",
      "lose_weight",
      "cut",
      "fat_loss",
      "weight_loss",
      "shred",
      "cutting",
    ].includes(g)
  )
    return "lose";
  if (
    [
      "gain",
      "gain_weight",
      "bulk",
      "build_muscle",
      "muscle_gain",
      "mass",
    ].includes(g)
  )
    return "gain";
  return "maintain";
}

export function mifflinStJeorBMR({
  gender,
  weightKg,
  heightCm,
  age,
}: {
  gender?: string | null; // "male" | "female" | other
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
}) {
  if (
    !gender ||
    !weightKg ||
    !heightCm ||
    typeof age !== "number" ||
    Number.isNaN(age)
  ) {
    return null;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const g = gender.toLowerCase();
  if (g === "male") return base + 5;
  if (g === "female") return base - 161;
  // neutral fallback
  return base - 78; // midway between +5 and -161
}

export function activityMultiplier(level?: string | null): number {
  switch ((level || "").toLowerCase()) {
    case "sedentary":
      return 1.2;
    case "light":
    case "lightly_active":
      return 1.375;
    case "moderate":
    case "moderately_active":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.375;
  }
}

// Now takes ANY goal string, normalizes internally
export function adjustForGoal(tdee: number, goal?: string | null): number {
  const g = normalizeGoal(goal);
  if (g === "lose") return Math.round(tdee * 0.8); // ~20% deficit
  if (g === "gain") return Math.round(tdee * 1.1); // ~10% surplus
  return Math.round(tdee); // maintain
}

/** Protein grams per kg tweaks per goal */
export function proteinGrams(weightKg?: number | null, goal?: string | null) {
  if (!weightKg) return null;
  const g = normalizeGoal(goal);
  const perKg = g === "lose" ? 2.0 : g === "gain" ? 1.6 : 1.8;
  return Math.round(weightKg * perKg);
}

export function macroSplit({
  targetCalories,
  proteinGrams,
}: {
  targetCalories: number;
  proteinGrams: number;
}) {
  const proteinCals = proteinGrams * 4;
  const fatCals = Math.round(targetCalories * 0.25);
  const carbCals = Math.max(targetCalories - proteinCals - fatCals, 0);
  return {
    fatGrams: Math.round(fatCals / 9),
    carbsGrams: Math.round(carbCals / 4),
  };
}
