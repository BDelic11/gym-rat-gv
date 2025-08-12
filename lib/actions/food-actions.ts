"use server";

import { prisma } from "@/lib/prisma";
import { openai, mealSchema } from "@/lib/openai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "../auth";
import { redirect } from "next/navigation";

// Zod schema for meal validation
const MealValidationSchema = z.object({
  type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  items: z.array(
    z.object({
      name: z.string().min(1, "Food item name is required"),
      quantity: z.number().positive("Quantity must be positive"),
      unit: z.string().min(1, "Unit is required"),
      calories: z.number().min(0, "Calories must be non-negative"),
      protein: z.number().min(0, "Protein must be non-negative"),
      carbs: z.number().min(0, "Carbs must be non-negative"),
      fat: z.number().min(0, "Fat must be non-negative"),
      fiber: z.number().min(0).optional(),
      sugar: z.number().min(0).optional(),
      sodium: z.number().min(0).optional(),
    })
  ),
});

export async function parseFoodText(text: string, mealType: string) {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      return { success: false, error: "No text provided to parse" };
    }

    if (text.length > 3000) {
      return { success: false, error: "Text too long to process" };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a certified nutritionist AI that parses food descriptions into accurate nutritional data.
          Parse the user's food description and return a JSON object matching this schema:
          ${JSON.stringify(mealSchema, null, 2)}
          
          Guidelines:
          - Use the meal type: ${mealType}
          - Base nutritional values on USDA Food Database standards
          - Be precise with portion sizes and units (prefer grams/ml over cups when possible)
          - Include fiber, sugar, and sodium for whole foods and packaged items
          - For homemade dishes, break down into main ingredients when possible
          - Use realistic calorie estimates - cross-reference multiple sources mentally
          - Common portion sizes: apple (150g), banana (120g), egg (50g), bread slice (30g)
          - Protein sources: chicken breast (25g protein/100g), eggs (13g protein/100g)
          - Always provide at least one food item
          - If quantity isn't specified, assume reasonable serving sizes
          - Round nutritional values to 1 decimal place
          - "type" MUST be one of EXACTLY: BREAKFAST | LUNCH | DINNER | SNACK | MID_MEAL (UPPERCASE).
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Very low temperature for consistent nutritional data
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return { success: false, error: "No response from AI parser" };
    }

    let parsedMeal;
    try {
      parsedMeal = JSON.parse(content);
      // --- normalize type ---
      const mapToEnum = (v?: string) => {
        if (!v) return undefined;
        const s = v.replace(/[\s_-]+/g, "").toLowerCase();
        if (s === "breakfast") return "BREAKFAST";
        if (s === "lunch") return "LUNCH";
        if (s === "dinner") return "DINNER";
        if (s === "snack") return "SNACK";
        if (s === "midmeal") return "MID_MEAL";
        return undefined;
      };

      // ako AI vrati lowercase ili ništa → popravi; ako i dalje nema, koristi parametar iz FE-a
      parsedMeal.type =
        mapToEnum(parsedMeal.type) || mapToEnum(mealType) || "LUNCH";
    } catch (error) {
      console.error("JSON parsing error:", error);
      return {
        success: false,
        error: "Invalid response format from AI parser",
      };
    }

    // Validate the parsed meal
    const validatedMeal = MealValidationSchema.parse(parsedMeal);

    // Additional validation
    if (validatedMeal.items.length === 0) {
      return { success: false, error: "No food items found in description" };
    }

    // Sanity check nutritional values
    for (const item of validatedMeal.items) {
      if (item.calories > 2000) {
        // Single item shouldn't exceed 2000 calories
        return {
          success: false,
          error: `Unrealistic calorie count for ${item.name}`,
        };
      }

      // Check if macros add up reasonably (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
      const calculatedCalories =
        item.protein * 4 + item.carbs * 4 + item.fat * 9;
      const difference = Math.abs(item.calories - calculatedCalories);

      if (difference > item.calories * 0.3) {
        // Allow 30% variance for fiber, alcohol, etc.
        console.warn(
          `Nutritional inconsistency for ${item.name}: ${item.calories} cal vs ${calculatedCalories} calculated`
        );
      }
    }

    return { success: true, meal: validatedMeal };
  } catch (error) {
    console.error("Food parsing error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid food data: ${error.errors
          .map((e) => e.message)
          .join(", ")}`,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse food description",
    };
  }
}

export async function saveMeal(mealData: z.infer<typeof MealValidationSchema>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        type: mealData.type,
        date: new Date(),
        items: {
          create: mealData.items.map((item, index) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            sugar: item.sugar,
            sodium: item.sodium,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/food");
    revalidatePath("/");

    return { success: true, meal };
  } catch (error) {
    console.error("Save meal error:", error);
    return { success: false, error: "Failed to save meal" };
  }
}

export async function getMeals() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        items: {},
      },
      orderBy: { createdAt: "asc" },
    });

    // Group meals by type
    const groupedMeals = {
      breakfast: meals.filter((meal) => meal.type === "BREAKFAST"),
      lunch: meals.filter((meal) => meal.type === "LUNCH"),
      dinner: meals.filter((meal) => meal.type === "DINNER"),
      snack: meals.filter((meal) => meal.type === "SNACK"),
    };

    return { success: true, meals: groupedMeals };
  } catch (error) {
    console.error("Get meals error:", error);
    return { success: false, error: "Failed to fetch meals" };
  }
}

export async function removeMealItem(itemId: string) {
  try {
    await prisma.mealItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/food");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Remove meal item error:", error);
    return { success: false, error: "Failed to remove meal item" };
  }
}

// --- Templates (presets) ---

export async function saveMealTemplate(
  mealData: z.infer<typeof MealValidationSchema>,
  name?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  try {
    const tpl = await prisma.mealTemplate.create({
      data: {
        userId: user.id,
        type: mealData.type,
        name:
          name ??
          mealData.items
            .map((i) => i.name)
            .slice(0, 2)
            .join(" + "),
        items: {
          create: mealData.items.map((item, idx) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            sugar: item.sugar,
            sodium: item.sodium,
          })),
        },
      },
      include: { items: true },
    });

    return { success: true, template: tpl };
  } catch (e) {
    console.error("saveMealTemplate error", e);
    return { success: false, error: "Failed to save template" };
  }
}

export async function listMealTemplates(mealType: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  try {
    const tpls = await prisma.mealTemplate.findMany({
      where: { userId: user.id, type: mealType as any },
      include: { items: {} },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, templates: tpls };
  } catch (e) {
    console.error("listMealTemplates error", e);
    return { success: false, error: "Failed to fetch templates" };
  }
}

export async function addTemplateToToday(templateId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  try {
    const tpl = await prisma.mealTemplate.findUnique({
      where: { id: templateId },
      include: { items: {} },
    });
    if (!tpl) return { success: false, error: "Template not found" };

    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        type: tpl.type,
        date: new Date(),
        items: {
          create: tpl.items.map((i, idx) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            calories: i.calories,
            protein: i.protein,
            carbs: i.carbs,
            fat: i.fat,
            fiber: i.fiber,
            sugar: i.sugar,
            sodium: i.sodium,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/food");
    revalidatePath("/");
    // redirect("/food");

    return { success: true, meal };
  } catch (e) {
    console.error("addTemplateToToday error", e);
    return { success: false, error: "Failed to add template" };
  }
}

export async function deleteMealTemplate(templateId: string) {
  try {
    await prisma.mealTemplate.delete({ where: { id: templateId } });
    return { success: true };
  } catch (e) {
    console.error("deleteMealTemplate error", e);
    return { success: false, error: "Failed to delete template" };
  }
}
