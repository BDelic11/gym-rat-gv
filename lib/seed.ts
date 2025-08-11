import { prisma } from "./prisma"

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...")

    // Create demo user
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

    console.log("✅ Created demo user:", user.email)

    // Create demo workout for today
    const today = new Date()
    const workout = await prisma.workout.upsert({
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

    console.log("✅ Created demo workout:", workout.name)

    // Create demo workout for yesterday (for trend calculation)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await prisma.workout.upsert({
      where: { id: "demo-workout-yesterday" },
      update: {},
      create: {
        id: "demo-workout-yesterday",
        userId: user.id,
        name: "Cardio Session",
        duration: 45,
        caloriesBurned: 305,
        date: yesterday,
        exercises: {
          create: [
            {
              name: "Running",
              category: "cardio",
              order: 1,
              sets: {
                create: [{ duration: 2700, distance: 5, order: 1 }], // 45 min, 5km
              },
            },
          ],
        },
      },
    })

    console.log("✅ Created yesterday's workout for trend calculation")

    // Create demo meal for today
    const meal = await prisma.meal.upsert({
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

    console.log("✅ Created demo meal:", meal.type)

    // Create additional meals for better dashboard data
    await prisma.meal.create({
      data: {
        userId: user.id,
        type: "lunch",
        date: today,
        items: {
          create: [
            {
              name: "Grilled Chicken Breast",
              quantity: 200,
              unit: "g",
              calories: 330,
              protein: 62,
              carbs: 0,
              fat: 7.4,
              order: 1,
            },
            {
              name: "Brown Rice",
              quantity: 150,
              unit: "g",
              calories: 216,
              protein: 5,
              carbs: 45,
              fat: 1.8,
              fiber: 3.5,
              order: 2,
            },
            {
              name: "Mixed Vegetables",
              quantity: 100,
              unit: "g",
              calories: 65,
              protein: 3,
              carbs: 13,
              fat: 0.3,
              fiber: 4,
              order: 3,
            },
          ],
        },
      },
    })

    console.log("✅ Created additional demo meals")

    console.log("🎉 Database seeded successfully!")
    return { user, workout, meal }
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seed completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Seed failed:", error)
      process.exit(1)
    })
}
