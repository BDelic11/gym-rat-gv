import { getDashboardData } from "@/lib/dashboard-data";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function CaloriesBurnedSection({
  userId,
}: {
  userId: string;
}) {
  const d = await getDashboardData(userId);
  return (
    <StatsCard
      title="Calories Burned Today"
      value={d.caloriesBurnedToday}
      trend={{
        value: Math.round(Math.abs(d.caloriesTrend)),
        isPositive: d.caloriesTrend > 0,
        label: "vs yesterday",
      }}
    />
  );
}
