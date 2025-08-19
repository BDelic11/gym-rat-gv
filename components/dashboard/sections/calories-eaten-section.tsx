import { getDashboardData } from "@/lib/dashboard-data";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function CaloriesEatenSection({
  userId,
}: {
  userId: string;
}) {
  const d = await getDashboardData(userId);
  const remaining = d.targetCalories - d.caloriesEatenToday;
  return (
    <StatsCard
      title="Calories Eaten Today"
      value={d.caloriesEatenToday}
      subtitle={
        remaining > 0
          ? `${remaining} remaining`
          : `${Math.abs(remaining)} over target`
      }
    />
  );
}
