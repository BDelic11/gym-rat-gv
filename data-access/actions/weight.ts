"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { weightEntrySchema } from "@/schemas/weight";

function toUtcMidnight(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

export async function addWeightLog(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = weightEntrySchema.safeParse({
    date: formData.get("date"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid data";
    throw new Error(message);
  }

  const date = toUtcMidnight(parsed.data.date);
  const weight = parseFloat(parsed.data.weight);

  await prisma.weightLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, weight },
    update: { weight },
  });

  revalidatePath("/profile");
}
