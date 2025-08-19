import { prisma } from "@/lib/prisma";
import {
  mifflinStJeorBMR,
  activityMultiplier,
  adjustForGoal,
  proteinGrams,
  macroSplit,
} from "./nutrition";
import { unstable_cache, revalidateTag } from "next/cache";

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
    return prisma.profile.update({
      where: { userId },
      data: { tdee, targetCalories },
    });
  }

  const { fatGrams, carbsGrams } = macroSplit({
    targetCalories,
    proteinGrams: pGrams,
  });

  return prisma.profile.update({
    where: { userId },
    data: {
      tdee,
      targetCalories,
      targetProtein: pGrams,
      targetFat: fatGrams,
      targetCarbs: carbsGrams,
    },
  });
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

/**
 * Interna (nekesirana) varijanta – optimizirani upiti.
 * Za 7-dnevni graf: jedan findMany i bucketiranje po danu.
 */
async function _getDashboardDataRaw(userId: string) {
  const profile = await ensureTargetsForUser(userId);
  const targetProtein = profile?.targetProtein ?? 0;
  const targetCalories = profile?.targetCalories ?? 0;

  // paralelno: danas + jučer
  const [todayMeals, todayWorkouts, yMeals, yWorkouts] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: startOfDay(), lte: endOfDay() } },
      include: { items: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: startOfDay(), lte: endOfDay() } },
      select: { caloriesBurned: true },
    }),
    (async () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return prisma.meal.findMany({
        where: { userId, date: { gte: startOfDay(y), lte: endOfDay(y) } },
        include: { items: true },
      });
    })(),
    (async () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return prisma.workout.findMany({
        where: { userId, date: { gte: startOfDay(y), lte: endOfDay(y) } },
        select: { caloriesBurned: true },
      });
    })(),
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

  // ---------- 7-day chart (1 query, bucketiranje) ----------
  const sevenDaysAgo = startOfDay(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  );
  const workouts7 = await prisma.workout.findMany({
    where: { userId, date: { gte: sevenDaysAgo, lte: endOfDay() } },
    select: { date: true, caloriesBurned: true },
  });

  const bucket = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    bucket.set(ymd(d), 0);
  }
  for (const w of workouts7) {
    const k = ymd(new Date(w.date));
    if (bucket.has(k)) {
      bucket.set(k, (bucket.get(k) || 0) + (w.caloriesBurned || 0));
    }
  }
  const days = Array.from(bucket.entries()).map(([k, v]) => ({
    day: new Date(k).toLocaleDateString(undefined, { weekday: "short" }),
    calories: Math.round(v || 0),
  }));

  // ---------- Streaks (30 dana – već imaš 2 upita; ostaje isto) ----------
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

  type DayAgg = { eaten: number; burned: number; net: number; logged: boolean };
  const dayMap = new Map<string, DayAgg>();
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

  let currentStreak = 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = ymd(d);
    const day = dayMap.get(k)!;
    const ok = targetCalories > 0 && day.logged && day.net <= targetCalories;
    if (!ok) break;
    currentStreak++;
  }

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
    bestStreak,
    praise,
  };
}

export const getDashboardData = unstable_cache(
  async (userId: string) => _getDashboardDataRaw(userId),
  // cache key: global + userId
  ["dashboard-data"],
  {
    revalidate: 30,
    tags: ["dashboard-data"],
  }
);

export async function getDashboardDataTagged(userId: string) {
  return getDashboardData(userId);
}
