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
        <Button variant="outline" size="icon">
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
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
              defaultValue={existing?.age || ""}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              defaultValue={existing?.weight || ""}
            />
          </div>
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.1"
              defaultValue={existing?.height || ""}
            />
          </div>
          <div>
            <Label htmlFor="goal">Goal</Label>
            <select
              id="goal"
              name="goal"
              defaultValue={existing?.goal || ""}
              className="w-full border rounded p-2"
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
