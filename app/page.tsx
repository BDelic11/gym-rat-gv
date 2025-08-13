import { Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProteinProgress } from "@/components/dashboard/protein-progress";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { AchievementsCard } from "@/components/dashboard/achievements-card"; // 👈 NEW
import { LoadingSpinner } from "@/components/loading-spinner";
import { getDashboardData } from "@/lib/dashboard-data";
import { ErrorBoundary } from "@/components/error-boundary";
import PageTitle from "@/components/page-title";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppLayout user={user}>
      <div className="p-6">
        <div className="mb-6">
          <PageTitle>Dashboard</PageTitle>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your fitness overview.
          </p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}
