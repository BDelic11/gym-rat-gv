import { getDashboardData } from "@/lib/dashboard-data";
import { ProteinProgress } from "@/components/dashboard/protein-progress";

export default async function ProteinProgressSection({
  userId,
}: {
  userId: string;
}) {
  const d = await getDashboardData(userId);
  return <ProteinProgress current={d.proteinToday} target={d.targetProtein} />;
}
