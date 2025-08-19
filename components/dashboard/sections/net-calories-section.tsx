import { getDashboardData } from "@/lib/dashboard-data";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function NetCaloriesSection({
  userId,
}: {
  userId: string;
}) {
  const d = await getDashboardData(userId);
  const net = d.caloriesEatenToday - d.caloriesBurnedToday;
  return (
    <StatsCard
      title="Net Calories"
      value={net}
      subtitle={`vs ${d.targetCalories} target`}
    />
  );
}
