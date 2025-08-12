"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recalcTargetsForUser } from "@/lib/dashboard-data";

const ProfileSchema = z.object({
  age: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  weight: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().positive().optional()
  ),
  height: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().positive().optional()
  ),
  gender: z.enum(["male", "female", "other"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z
    .enum(["lose_weight", "gain_weight", "maintain", "build_muscle"])
    .optional(),
});

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = ProfileSchema.safeParse({
    age: formData.get("age"),
    weight: formData.get("weight"),
    height: formData.get("height"),
    gender: (formData.get("gender") || "").toString(),
    activityLevel: (formData.get("activityLevel") || "").toString(),
    goal: formData.get("goal") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data = parsed.data;

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      age: data.age ?? null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal ?? null,
    },
    create: {
      userId: user.id,
      age: data.age ?? null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal ?? null,
    },
  });

  await recalcTargetsForUser(user.id);

  revalidatePath("/profile");
  revalidatePath("/");
}

const OnboardingSchema = z.object({
  age: z.coerce.number().int().min(12).max(100),
  weight: z.coerce.number().min(30).max(400),
  height: z.coerce.number().min(120).max(250),
  gender: z.enum(["male", "female", "other"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum(["lose_weight", "gain_weight", "maintain", "build_muscle"]),
});

export async function completeOnboarding(
  data: z.infer<typeof OnboardingSchema>
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      age: data.age,
      weight: data.weight,
      height: data.height,
      gender: data.gender as any,
      activityLevel: data.activityLevel as any,
      goal: data.goal,
    },
  });

  await recalcTargetsForUser(user.id);
  redirect("/");
}
