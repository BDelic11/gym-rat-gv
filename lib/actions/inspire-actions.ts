"use server";

import { z } from "zod";
import { openai } from "@/lib/openai";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const GeneratedItem = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
});

const GeneratedMealSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  items: z.array(GeneratedItem).min(1),
  steps: z.array(z.string()).min(1),
});

export async function generateMealInspiration(input: {
  mealType: MealType;
  include?: string;
  exclude?: string;
  notes?: string;
}) {
  const sys = `Ti si vrhunski kuhar i nutricionist. Generiraj JEDAN prijedlog jela.
Vrati ISKLJUČIVO JSON koji prati ovu shemu:
{
  "title": string,
  "type": "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
  "items": [
    { "name": string, "quantity": number, "unit": string, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber"?: number, "sugar"?: number, "sodium"?: number }
  ],
  "steps": string[]
}
Smjernice:
- Tip obroka: ${input.mealType}
- Uključi: ${input.include || "-"}
- Isključi (alergije/preferencije): ${input.exclude || "-"}
- Napomene: ${input.notes || "-"}
- Porcije realne (grami/ml), utemeljeno na javnim nutritivnim tablicama; za homemade jela razloži na ključne sastojke.
- Makroi mora imati svaki sastojak. Zaokruži na 1 decimalu.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: "Predloži jedno jelo." },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Prazan odgovor modela.");

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Nevažeći JSON odgovor modela.");
  }

  const parsed = GeneratedMealSchema.parse(data);
  return parsed;
}

// simple workout generator (placeholder)
export async function generateWorkoutInspiration(input: {
  goal: string;
  include?: string;
  exclude?: string;
  notes?: string;
}) {
  const sys = `Ti si iskusni trener. Generiraj sažet plan u koracima (5-10 koraka).
Vrati ISKLJUČIVO JSON oblika: { "steps": string[] }.
Parametri:
- Cilj: ${input.goal}
- Uključi: ${input.include || "-"}
- Isključi: ${input.exclude || "-"}
- Napomene: ${input.notes || "-"}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: "Generiraj plan." },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Prazan odgovor modela.");

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Nevažeći JSON odgovor modela.");
  }
  if (!Array.isArray(json.steps) || json.steps.length === 0) {
    throw new Error("Model nije vratio korake.");
  }
  return json.steps as string[];
}
