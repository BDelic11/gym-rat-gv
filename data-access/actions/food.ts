"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Meal, MealItem } from "@prisma/client";

export async function getMeals() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const meals = await prisma.meal.findMany({
    where: { userId: user.id, date: today },
    include: { items: true },
  });

  return { success: true, meals };
}

export async function saveMeal(meal: any) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const saved = await prisma.meal.create({
    data: {
      userId: user.id,
      type: meal.type,
      date: new Date(),
      items: {
        create: meal.items.map((item: MealItem) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })),
      },
    },
  });

  return { success: true, meal: saved };
}

export async function removeMealItem(itemId: string) {
  await prisma.mealItem.delete({ where: { id: itemId } });
  return { success: true };
}
