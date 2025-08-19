import { Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import PageTitle from "@/components/page-title";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import CaloriesBurnedSection from "@/components/dashboard/sections/calories-burned-section";
import CaloriesEatenSection from "@/components/dashboard/sections/calories-eaten-section";
import NetCaloriesSection from "@/components/dashboard/sections/net-calories-section";
import ProteinProgressSection from "@/components/dashboard/sections/protein-progress-section";
import AchievementsSection from "@/components/dashboard/sections/achievements-section";
import TrendsChartSection from "@/components/dashboard/sections/trends-chart-section";

import {
  StatCardSkeleton,
  ProteinProgressSkeleton,
  AchievementsSkeleton,
  TrendsChartSkeleton,
} from "@/components/dashboard/part-skeleton";

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={<StatCardSkeleton />}>
              <CaloriesBurnedSection userId={user.id} />
            </Suspense>

            <Suspense fallback={<StatCardSkeleton />}>
              <CaloriesEatenSection userId={user.id} />
            </Suspense>

            <Suspense fallback={<StatCardSkeleton />}>
              <NetCaloriesSection userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProteinProgressSkeleton />}>
              <ProteinProgressSection userId={user.id} />
            </Suspense>

            <Suspense fallback={<AchievementsSkeleton />}>
              <AchievementsSection userId={user.id} />
            </Suspense>

            <Suspense
              fallback={<TrendsChartSkeleton className="md:col-span-2" />}
            >
              <TrendsChartSection userId={user.id} className="md:col-span-2" />
            </Suspense>
          </div>
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}
