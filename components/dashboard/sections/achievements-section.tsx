import { getDashboardData } from "@/lib/dashboard-data";
import { AchievementsCard } from "@/components/dashboard/achievements-card";

export default async function AchievementsSection({
  userId,
}: {
  userId: string;
}) {
  const d = await getDashboardData(userId);
  return (
    <AchievementsCard
      proteinYesterday={d.proteinYesterday}
      targetProtein={d.targetProtein}
      netYesterday={d.netYesterday}
      targetCalories={d.targetCalories}
      hitProteinYesterday={d.hitProteinYesterday}
      hitCaloriesYesterday={d.hitCaloriesYesterday}
      currentStreak={d.currentStreak}
      bestStreak={d.bestStreak}
      praise={d.praise}
    />
  );
}
