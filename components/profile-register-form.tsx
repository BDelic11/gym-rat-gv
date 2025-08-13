"use client";

import { z } from "zod";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { completeOnboarding } from "@/data-access/actions/profile";

const OnboardingSchema = z.object({
  age: z.coerce.number().int().min(12).max(100),
  weight: z.coerce.number().min(30).max(400),
  height: z.coerce.number().min(120).max(250),
  gender: z.enum(["male", "female", "other"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active", // <-- underscore (not hyphen)
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum(["lose_weight", "gain_weight", "maintain", "build_muscle"]),
});

type FormValues = z.infer<typeof OnboardingSchema>;

export function OnboardingProfileForm({
  existing,
}: {
  existing?: Partial<FormValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      age: existing?.age,
      weight: existing?.weight,
      height: existing?.height,
      gender: existing?.gender as any,
      activityLevel: existing?.activityLevel as any,
      goal: existing?.goal as any,
    },
  });

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    startTransition(async () => {
      try {
        // Call the server action; if it redirects, code below won't run.
        await completeOnboarding(values);
      } catch (e: any) {
        // Support structured JSON errors from the server action
        let msg = e?.message || "Failed to save profile";
        try {
          const payload = JSON.parse(msg);
          if (payload?.type === "field" && payload.field) {
            setError(payload.field as keyof FormValues, {
              type: "server",
              message: payload.message || "Invalid value",
            });
            return;
          }
          if (payload?.message) msg = payload.message;
        } catch {
          // not JSON, fall through
        }
        setFormError(msg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="age">Age *</Label>
        <Input
          id="age"
          type="number"
          min={12}
          max={100}
          {...register("age", { valueAsNumber: true })}
        />
        {errors.age && (
          <p className="text-sm text-red-500">{errors.age.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (kg) *</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          {...register("weight", { valueAsNumber: true })}
        />
        {errors.weight && (
          <p className="text-sm text-red-500">{errors.weight.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="height">Height (cm) *</Label>
        <Input
          id="height"
          type="number"
          step="0.1"
          {...register("height", { valueAsNumber: true })}
        />
        {errors.height && (
          <p className="text-sm text-red-500">{errors.height.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">Gender *</Label>
        <select
          id="gender"
          className="w-full border rounded p-2 bg-background"
          {...register("gender")}
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && (
          <p className="text-sm text-red-500">{errors.gender.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="activityLevel">Activity level *</Label>
        <select
          id="activityLevel"
          className="w-full border rounded p-2 bg-background"
          {...register("activityLevel")}
        >
          <option value="">Select...</option>
          <option value="sedentary">Sedentary</option>
          <option value="lightly_active">Lightly active</option>
          <option value="moderate">Moderately active</option>
          <option value="active">Active</option>
          <option value="very_active">Very active</option>
        </select>
        {errors.activityLevel && (
          <p className="text-sm text-red-500">{errors.activityLevel.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goal">Goal *</Label>
        <select
          id="goal"
          className="w-full border rounded p-2 bg-background"
          {...register("goal")}
        >
          <option value="">Select...</option>
          <option value="lose_weight">Lose weight</option>
          <option value="gain_weight">Gain weight</option>
          <option value="maintain">Maintain</option>
          <option value="build_muscle">Build muscle</option>
        </select>
        {errors.goal && (
          <p className="text-sm text-red-500">{errors.goal.message}</p>
        )}
      </div>

      {formError && (
        <p className="text-sm text-red-500" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </span>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}
