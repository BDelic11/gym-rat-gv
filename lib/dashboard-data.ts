import { prisma } from "./prisma"

export async function getDashboardData(userId: string) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const endOfToday = new Date(today.setHours(23, 59, 59, 999))
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))
  const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999))

  // Get user profile for targets
  const profile = await prisma.profile.findUnique({
    where: { userId },
  })

  // Get today's workouts
  const todayWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  })

  // Get yesterday's workouts
  const yesterdayWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: startOfYesterday,
        lte: endOfYesterday,
      },
    },
  })

  // Get today's meals
  const todayMeals = await prisma.meal.findMany({
    where: {
      userId,
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      items: true,
    },
  })

  // Calculate calories burned today
  const caloriesBurnedToday = todayWorkouts.reduce((total, workout) => {
    return total + (workout.caloriesBurned || 0)
  }, 0)

  // Calculate calories burned yesterday
  const caloriesBurnedYesterday = yesterdayWorkouts.reduce((total, workout) => {
    return total + (workout.caloriesBurned || 0)
  }, 0)

  // Calculate calories eaten today
  const caloriesEatenToday = todayMeals.reduce((total, meal) => {
    return total + meal.items.reduce((mealTotal, item) => mealTotal + item.calories, 0)
  }, 0)

  // Calculate protein consumed today
  const proteinToday = todayMeals.reduce((total, meal) => {
    return total + meal.items.reduce((mealTotal, item) => mealTotal + item.protein, 0)
  }, 0)

  // Calculate trend for calories burned
  const caloriesTrend =
    caloriesBurnedYesterday > 0 ? ((caloriesBurnedToday - caloriesBurnedYesterday) / caloriesBurnedYesterday) * 100 : 0

  // Get 7-day data for trends
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const weeklyWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: sevenDaysAgo,
        lte: endOfToday,
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  // Group workouts by day for trends
  const trendsData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayStart = new Date(date.setHours(0, 0, 0, 0))
    const dayEnd = new Date(date.setHours(23, 59, 59, 999))

    const dayWorkouts = weeklyWorkouts.filter((workout) => workout.date >= dayStart && workout.date <= dayEnd)

    const dayCalories = dayWorkouts.reduce((total, workout) => total + (workout.caloriesBurned || 0), 0)

    trendsData.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      calories: dayCalories,
    })
  }

  return {
    caloriesBurnedToday,
    caloriesBurnedYesterday,
    caloriesTrend,
    caloriesEatenToday,
    proteinToday,
    targetCalories: profile?.targetCalories || 2800,
    targetProtein: profile?.targetProtein || 140,
    trendsData,
  }
}
