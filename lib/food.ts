import { prisma } from "@/lib/prisma";
import type { MealType } from "@prisma/client";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type MealsByType = {
  breakfast: any[];
  lunch: any[];
  dinner: any[];
  snack: any[];
};

export async function getTodayMeals(userId: string): Promise<MealsByType> {
  const meals = await prisma.meal.findMany({
    where: { userId, date: { gte: startOfDay(), lte: endOfDay() } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const bucket: MealsByType = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const m of meals) {
    switch (m.type as MealType) {
      case "BREAKFAST":
        bucket.breakfast.push(m);
        break;
      case "LUNCH":
        bucket.lunch.push(m);
        break;
      case "DINNER":
        bucket.dinner.push(m);
        break;
      case "SNACK":
        bucket.snack.push(m);
        break;
    }
  }
  return bucket;
}
