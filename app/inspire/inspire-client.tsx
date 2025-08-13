"use client";

import { useState } from "react";
import PageTitle from "@/components/page-title";
import { InspireCard } from "@/components/inspire/inspire-card";
import { MealInspireModal } from "@/components/inspire/meal-inspire-modal";
import { WorkoutInspireModal } from "@/components/inspire/workout-inspire-modal";
import { UtensilsCrossed, Dumbbell } from "lucide-react";

export default function InspireClient() {
  const [openMeal, setOpenMeal] = useState(false);
  const [openWorkout, setOpenWorkout] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <PageTitle>Inspire</PageTitle>
        <p className="text-muted-foreground">
          Brzo generiraj ideje za obroke i treninge — prilagođeno tvojim
          željama.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InspireCard
          title="Meal"
          description="Predloži mi obrok po mjeri."
          icon={UtensilsCrossed}
          onClick={() => setOpenMeal(true)}
        />
        <InspireCard
          title="Workout"
          description="Predloži mi trening plan."
          icon={Dumbbell}
          onClick={() => setOpenWorkout(true)}
        />
      </div>

      <MealInspireModal open={openMeal} onOpenChange={setOpenMeal} />
      <WorkoutInspireModal open={openWorkout} onOpenChange={setOpenWorkout} />
    </div>
  );
}
