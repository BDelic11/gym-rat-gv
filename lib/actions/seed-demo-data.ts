"use server"

import { prisma } from "@/lib/prisma"

export async function seedDemoData() {
  try {
    // Create demo user if doesn't exist
    const user = await prisma.user.upsert({
      where: { id: "demo-user-id" },
      update: {},
      create: {
        id: "demo-user-id",
        email: "demo@gym.ai",
        name: "Demo User",
        profile: {
          create: {
            age: 30,
            weight: 75,
            height: 175,
            gender: "male",
            goal: "build_muscle",
            activityLevel: "moderate",
            tdee: 2500,
            targetCalories: 2800,
            targetProtein: 140,
            targetCarbs: 350,
            targetFat: 93,
          },
        },
      },
      include: {
        profile: true,
      },
    })

    // Create demo workout for today
    const today = new Date()
    await prisma.workout.upsert({
      where: { id: "demo-workout-today" },
      update: {},
      create: {
        id: "demo-workout-today",
        userId: user.id,
        name: "Upper Body Strength",
        duration: 60,
        caloriesBurned: 350,
        date: today,
        exercises: {
          create: [
            {
              name: "Bench Press",
              category: "strength",
              order: 1,
              sets: {
                create: [
                  { reps: 10, weight: 80, order: 1, restTime: 120 },
                  { reps: 8, weight: 85, order: 2, restTime: 120 },
                  { reps: 6, weight: 90, order: 3, restTime: 120 },
                ],
              },
            },
            {
              name: "Pull-ups",
              category: "strength",
              order: 2,
              sets: {
                create: [
                  { reps: 8, order: 1, restTime: 90 },
                  { reps: 6, order: 2, restTime: 90 },
                  { reps: 5, order: 3, restTime: 90 },
                ],
              },
            },
          ],
        },
      },
    })

    // Create demo meal for today
    await prisma.meal.upsert({
      where: { id: "demo-meal-today" },
      update: {},
      create: {
        id: "demo-meal-today",
        userId: user.id,
        type: "breakfast",
        date: today,
        items: {
          create: [
            {
              name: "Oatmeal",
              quantity: 100,
              unit: "g",
              calories: 389,
              protein: 16.9,
              carbs: 66.3,
              fat: 6.9,
              fiber: 10.6,
              order: 1,
            },
            {
              name: "Banana",
              quantity: 1,
              unit: "piece",
              calories: 105,
              protein: 1.3,
              carbs: 27,
              fat: 0.4,
              fiber: 3.1,
              order: 2,
            },
            {
              name: "Greek Yogurt",
              quantity: 150,
              unit: "g",
              calories: 100,
              protein: 17,
              carbs: 6,
              fat: 0.4,
              fiber: 0,
              order: 3,
            },
          ],
        },
      },
    })

    return { success: true, message: "Demo data seeded successfully" }
  } catch (error) {
    console.error("Error seeding demo data:", error)
    return { success: false, message: "Failed to seed demo data" }
  }
}
