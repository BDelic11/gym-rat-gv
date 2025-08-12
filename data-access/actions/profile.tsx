"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const age = Number(formData.get("age"));
  const weight = Number(formData.get("weight"));
  const height = Number(formData.get("height"));
  const goal = formData.get("goal")?.toString() || null;

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      age: age || null,
      weight: weight || null,
      height: height || null,
      goal,
    },
    update: {
      age: age || null,
      weight: weight || null,
      height: height || null,
      goal,
    },
  });

  revalidatePath("/profile");
}
