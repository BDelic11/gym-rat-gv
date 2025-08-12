"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/data-access/actions/profile";

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

type FormValues = z.infer<typeof OnboardingSchema>;

export function OnboardingProfileForm({ existing }: { existing?: any }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      age: (existing?.age as number) ?? undefined,
      weight: (existing?.weight as number) ?? undefined,
      height: (existing?.height as number) ?? undefined,
      gender: (existing?.gender as any) ?? undefined,
      activityLevel: (existing?.activityLevel as any) ?? undefined,
      goal: (existing?.goal as any) ?? undefined,
    },
  });

  return (
    <form
      action={async (fd: FormData) => {
        const data = Object.fromEntries(fd) as Record<string, string>;
        const parsed = OnboardingSchema.safeParse(data);
        if (!parsed.success) throw new Error("Invalid profile data");
        await completeOnboarding(parsed.data);
      }}
      className="space-y-5"
    >
      <div className="grid gap-2">
        <Label htmlFor="age">Age *</Label>
        <Input id="age" name="age" type="number" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (kg) *</Label>
        <Input id="weight" name="weight" type="number" step="0.1" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="height">Height (cm) *</Label>
        <Input id="height" name="height" type="number" step="0.1" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">Gender *</Label>
        <select
          id="gender"
          name="gender"
          required
          className="w-full border rounded p-2 bg-background"
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="activityLevel">Activity level *</Label>
        <select
          id="activityLevel"
          name="activityLevel"
          required
          className="w-full border rounded p-2 bg-background"
        >
          <option value="">Select...</option>
          <option value="sedentary">Sedentary</option>
          <option value="lightly-active">Lightly active</option>
          <option value="moderate">Moderately active</option>
          <option value="active">Active</option>
          <option value="very_active">Very active</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goal">Goal *</Label>
        <select
          id="goal"
          name="goal"
          required
          className="w-full border rounded p-2 bg-background"
        >
          <option value="">Select...</option>
          <option value="lose_weight">Lose weight</option>
          <option value="gain_weight">Gain weight</option>
          <option value="maintain">Maintain</option>
          <option value="build_muscle">Build muscle</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
