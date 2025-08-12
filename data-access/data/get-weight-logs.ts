import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getWeightLogs() {
  const user = await getCurrentUser();
  if (!user) return [];

  const logs = await prisma.weightLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  return logs.map((log) => ({
    date: log.date.toISOString().split("T")[0],
    weight: Number(log.weight),
  }));
}
