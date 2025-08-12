"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateProfile } from "@/data-access/actions/profile";

export function ProfileModal({ existing }: { existing?: any }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateProfile(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Edit profile">
          +
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit Profile" : "Create Profile"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              name="age"
              type="number"
              defaultValue={existing?.age ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              defaultValue={existing?.weight ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.1"
              defaultValue={existing?.height ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <select
              id="gender"
              name="gender"
              required
              defaultValue={existing?.gender ?? ""}
              className="w-full border rounded-md bg-background p-2"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="activityLevel">
              Activity Level <span className="text-destructive">*</span>
            </Label>
            <select
              id="activityLevel"
              name="activityLevel"
              required
              defaultValue={existing?.activityLevel ?? ""}
              className="w-full border rounded-md bg-background p-2"
            >
              <option value="" disabled>
                Select activity level
              </option>
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="lightly_active">
                Lightly Active (1–3 days/wk)
              </option>
              <option value="moderate">Moderately Active (3–5 days/wk)</option>
              <option value="active">Active (6–7 days/wk)</option>
              <option value="very_active">Very Active (hard daily)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <select
              id="goal"
              name="goal"
              defaultValue={existing?.goal ?? ""}
              className="w-full border rounded-md bg-background p-2"
            >
              <option value="">Select a goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="gain_weight">Gain Weight</option>
              <option value="maintain">Maintain</option>
              <option value="build_muscle">Build Muscle</option>
            </select>
          </div>

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
