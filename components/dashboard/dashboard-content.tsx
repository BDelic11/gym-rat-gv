import { StatsCard } from "@/components/dashboard/stats-card";
import { ProteinProgress } from "@/components/dashboard/protein-progress";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { getDashboardData } from "@/lib/dashboard-data";
interface DashboardContentProps {
  user: {
    id: string;
  };
}

export async function DashboardContent({ user }: DashboardContentProps) {
  const d = await getDashboardData(user.id);

  const netCalories = d.caloriesEatenToday - d.caloriesBurnedToday;
  const caloriesRemaining = d.targetCalories - d.caloriesEatenToday;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Calories Burned Today"
        value={d.caloriesBurnedToday}
        trend={{
          value: Math.round(Math.abs(d.caloriesTrend)),
          isPositive: d.caloriesTrend > 0,
          label: "vs yesterday",
        }}
      />

      <StatsCard
        title="Calories Eaten Today"
        value={d.caloriesEatenToday}
        subtitle={
          caloriesRemaining > 0
            ? `${caloriesRemaining} remaining`
            : `${Math.abs(caloriesRemaining)} over target`
        }
      />

      <StatsCard
        title="Net Calories"
        value={netCalories}
        subtitle={`vs ${d.targetCalories} target`}
      />

      <ProteinProgress current={d.proteinToday} target={d.targetProtein} />

      {/* NEW: Achievements / Streaks */}
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

      <TrendsChart data={d.trendsData} className="md:col-span-2" />
    </div>
  );
}
