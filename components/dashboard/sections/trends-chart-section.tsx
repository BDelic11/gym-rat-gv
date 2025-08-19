import { getDashboardData } from "@/lib/dashboard-data";
import dynamic from "next/dynamic";

const TrendsChart = dynamic<{
  data: { day: string; calories: number }[];
  className?: string;
}>(
  () =>
    import("@/components/dashboard/trends-chart").then(
      (mod) => mod.TrendsChart
    ),
  {
    ssr: false,
  }
);

export default async function TrendsChartSection({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) {
  const d = await getDashboardData(userId);

  return <TrendsChart data={d.trendsData} className={className} />;
}
