// lib/dashboard-data.ts
import { prisma } from "@/lib/prisma";
import {
  mifflinStJeorBMR,
  activityMultiplier,
  adjustForGoal,
  proteinGrams,
  macroSplit,
} from "./nutrition";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function ensureTargetsForUser(userId: string) {
  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) profile = await prisma.profile.create({ data: { userId } });

  const missingTargets =
    profile.tdee == null ||
    profile.targetCalories == null ||
    profile.targetProtein == null ||
    profile.targetCarbs == null ||
    profile.targetFat == null;

  if (!missingTargets) return profile;

  const bmr = mifflinStJeorBMR({
    gender: profile.gender,
    weightKg: profile.weight ?? undefined,
    heightCm: profile.height ?? undefined,
    age: profile.age ?? undefined,
  });
  if (!bmr) return profile;

  const tdee = Math.round(bmr * activityMultiplier(profile.activityLevel));
  const targetCalories = adjustForGoal(tdee, profile.goal);

  const pGrams = proteinGrams(profile.weight, profile.goal);
  if (!pGrams) {
    const updated = await prisma.profile.update({
      where: { userId },
      data: { tdee, targetCalories },
    });
    return updated;
  }

  const { fatGrams, carbsGrams } = macroSplit({
    targetCalories,
    proteinGrams: pGrams,
  });

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      tdee,
      targetCalories,
      targetProtein: pGrams,
      targetFat: fatGrams,
      targetCarbs: carbsGrams,
    },
  });

  return updated;
}

export async function recalcTargetsForUser(userId: string) {
  await prisma.profile.update({
    where: { userId },
    data: {
      tdee: null,
      targetCalories: null,
      targetProtein: null,
      targetCarbs: null,
      targetFat: null,
    },
  });
  return ensureTargetsForUser(userId);
}

export async function getDashboardData(userId: string) {
  const profile = await ensureTargetsForUser(userId);
  const targetProtein = profile?.targetProtein ?? 0;
  const targetCalories = profile?.targetCalories ?? 0;

  // ---------- Today ----------
  const [todayMeals, todayWorkouts] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: startOfDay(), lte: endOfDay() } },
      include: { items: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: startOfDay(), lte: endOfDay() } },
      select: { caloriesBurned: true },
    }),
  ]);

  const caloriesEatenToday = Math.round(
    todayMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, i) => s + (i.calories || 0), 0),
      0
    )
  );
  const proteinToday = Math.round(
    todayMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, i) => s + (i.protein || 0), 0),
      0
    )
  );
  const caloriesBurnedToday = Math.round(
    todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)
  );

  // ---------- Yesterday ----------
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const [yMeals, yWorkouts] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: startOfDay(y), lte: endOfDay(y) } },
      include: { items: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: startOfDay(y), lte: endOfDay(y) } },
      select: { caloriesBurned: true },
    }),
  ]);

  const proteinYesterday = Math.round(
    yMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, i) => s + (i.protein || 0), 0),
      0
    )
  );
  const eatenYesterday = Math.round(
    yMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, i) => s + (i.calories || 0), 0),
      0
    )
  );
  const burnedYesterday = Math.round(
    yWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)
  );
  const netYesterday = eatenYesterday - burnedYesterday;

  const hitProteinYesterday =
    targetProtein > 0 && proteinYesterday >= targetProtein;
  const hitCaloriesYesterday =
    targetCalories > 0 && netYesterday <= targetCalories;

  // ---------- 7-day chart (burned) ----------
  const days: { day: string; calories: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const burned = await prisma.workout.aggregate({
      where: { userId, date: { gte: startOfDay(d), lte: endOfDay(d) } },
      _sum: { caloriesBurned: true },
    });
    days.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      calories: Math.round(burned._sum.caloriesBurned || 0),
    });
  }

  // ---------- Streaks (last 30 days, up to yesterday) ----------
  const from = startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const to = endOfDay(new Date());
  const [rangeMeals, rangeWorkouts] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: from, lte: to } },
      include: { items: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { date: true, caloriesBurned: true },
    }),
  ]);

  // Aggregate per-day totals
  type DayAgg = { eaten: number; burned: number; net: number; logged: boolean };
  const dayMap = new Map<string, DayAgg>();

  // init last 30 days (so gaps are explicit and break streaks)
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(ymd(d), { eaten: 0, burned: 0, net: 0, logged: false });
  }

  rangeMeals.forEach((m) => {
    const k = ymd(new Date(m.date));
    const cur = dayMap.get(k);
    if (!cur) return;
    cur.eaten += m.items.reduce((s, i) => s + (i.calories || 0), 0);
    cur.logged = true;
  });

  rangeWorkouts.forEach((w) => {
    const k = ymd(new Date(w.date));
    const cur = dayMap.get(k);
    if (!cur) return;
    cur.burned += w.caloriesBurned || 0;
    cur.logged = true;
  });

  for (const v of dayMap.values()) v.net = v.eaten - v.burned;

  // Any data at all in the window?
  const hasLoggedAnyDayLast30 = Array.from(dayMap.values()).some(
    (d) => d.logged
  );

  // compute best streak (exclude today), only counting days that were logged AND under target
  let bestStreak = 0;
  let running = 0;
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = ymd(d);
    const day = dayMap.get(k)!;

    const ok = targetCalories > 0 && day.logged && day.net <= targetCalories;

    running = ok ? running + 1 : 0;
    bestStreak = Math.max(bestStreak, running);
  }

  // current streak (consecutive ok days ending yesterday) + when it started
  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  for (let i = 1; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = ymd(d);
    const day = dayMap.get(k)!;

    const ok = targetCalories > 0 && day.logged && day.net <= targetCalories;

    if (!ok) break;
    currentStreak++;
    currentStreakStart = k; // earliest day in the current run
  }

  // quick motivational line
  let praise = "Let’s make today count!";
  if (currentStreak >= 7) praise = "🔥 On fire! A full week on target!";
  else if (currentStreak >= 3) praise = "👏 Great momentum—keep it rolling!";
  else if (hitProteinYesterday && hitCaloriesYesterday)
    praise = "💪 Nailed protein and calories yesterday. Awesome!";

  return {
    caloriesBurnedToday,
    caloriesBurnedYesterday: burnedYesterday,
    caloriesTrend: caloriesBurnedToday - burnedYesterday,
    caloriesEatenToday,
    proteinToday,
    targetCalories,
    targetProtein,
    trendsData: days,

    proteinYesterday,
    netYesterday,
    hitProteinYesterday,
    hitCaloriesYesterday,

    currentStreak,
    currentStreakStart,
    bestStreak,
    hasLoggedAnyDayLast30,
    praise,
  };
}
