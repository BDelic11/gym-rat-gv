import { Suspense } from "react"
import { AppLayout } from "@/components/app-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ProteinProgress } from "@/components/dashboard/protein-progress"
import { TrendsChart } from "@/components/dashboard/trends-chart"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getDashboardData } from "@/lib/dashboard-data"
import { ErrorBoundary } from "@/components/error-boundary"

const DEMO_USER_ID = "demo-user-id"

async function DashboardContent() {
  const dashboardData = await getDashboardData(DEMO_USER_ID).catch(() => ({
    caloriesBurnedToday: 350,
    caloriesBurnedYesterday: 305,
    caloriesTrend: 15,
    caloriesEatenToday: 1850,
    proteinToday: 85,
    targetCalories: 2800,
    targetProtein: 140,
    trendsData: [
      { day: "Mon", calories: 280 },
      { day: "Tue", calories: 320 },
      { day: "Wed", calories: 290 },
      { day: "Thu", calories: 380 },
      { day: "Fri", calories: 305 },
      { day: "Sat", calories: 420 },
      { day: "Sun", calories: 350 },
    ],
  }))

  const netCalories = dashboardData.caloriesEatenToday - dashboardData.caloriesBurnedToday
  const caloriesRemaining = dashboardData.targetCalories - dashboardData.caloriesEatenToday

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Calories Burned Today */}
      <StatsCard
        title="Calories Burned Today"
        value={dashboardData.caloriesBurnedToday}
        trend={{
          value: Math.round(Math.abs(dashboardData.caloriesTrend)),
          isPositive: dashboardData.caloriesTrend > 0,
          label: "vs yesterday",
        }}
      />

      {/* Calories Eaten Today */}
      <StatsCard
        title="Calories Eaten Today"
        value={dashboardData.caloriesEatenToday}
        subtitle={
          caloriesRemaining > 0 ? `${caloriesRemaining} remaining` : `${Math.abs(caloriesRemaining)} over target`
        }
      />

      {/* Net Calories vs Target */}
      <StatsCard title="Net Calories" value={netCalories} subtitle={`vs ${dashboardData.targetCalories} target`} />

      {/* Protein Progress */}
      <ProteinProgress current={dashboardData.proteinToday} target={dashboardData.targetProtein} />

      {/* 7-Day Trends Chart */}
      <TrendsChart data={dashboardData.trendsData} className="md:col-span-2" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your fitness overview.</p>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner size="lg" text="Loading dashboard..." className="py-12" />}>
            <DashboardContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </AppLayout>
  )
}
