"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

interface WorkoutData {
  id: string;
  name: string;
  date: Date;
  duration: number | null;
  caloriesBurned: number | null;
  exercises: Array<{
    id: string;
    name: string;
    category: string;
    sets: Array<{
      id: string;
      reps: number | null;
      weight: number | null;
      duration: number | null;
      distance: number | null;
      order: number;
    }>;
  }>;
}

interface WorkoutTableProps {
  workouts: WorkoutData[];
}

export function WorkoutTable({ workouts }: WorkoutTableProps) {
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(
    new Set()
  );

  const toggleWorkout = (workoutId: string) => {
    const next = new Set(expandedWorkouts);
    next.has(workoutId) ? next.delete(workoutId) : next.add(workoutId);
    setExpandedWorkouts(next);
  };

  const formatSetInfo = (set: WorkoutData["exercises"][0]["sets"][0]) => {
    const parts: string[] = [];
    if (set.reps) parts.push(`${set.reps} reps`);
    if (set.weight) parts.push(`${set.weight}kg`);
    if (set.duration)
      parts.push(
        `${Math.floor(set.duration / 60)}:${(set.duration % 60)
          .toString()
          .padStart(2, "0")}`
      );
    if (set.distance) parts.push(`${set.distance}km`);
    return parts.join(" • ");
  };

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            No workouts logged yet. Start by adding your first workout below!
          </p>

          <div className="mx-auto max-w-md text-left rounded-lg border bg-muted/40 p-3">
            <div className="mb-1">
              <Badge variant="secondary">TIP</Badge>
            </div>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>
                The more clearly you describe what you did (sets, reps, weight,
                duration…), the more accurate your log will be.
              </li>
              <li>
                Use the <span className="font-medium">voice</span> input for
                faster entry.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => {
        const isExpanded = expandedWorkouts.has(workout.id);
        const totalSets = workout.exercises.reduce(
          (acc, ex) => acc + ex.sets.length,
          0
        );

        return (
          <Card key={workout.id}>
            <CardHeader className="pb-3">
              {/* HEADER: stacks on mobile, row on sm+ */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* left block */}
                <div className="flex items-start gap-2 sm:items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWorkout(workout.id)}
                    className="h-8 w-8 shrink-0"
                    aria-label={
                      isExpanded ? "Collapse workout" : "Expand workout"
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">
                      {workout.name}
                    </CardTitle>

                    {/* meta row: wraps nicely on mobile */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(workout.date), "MMM d, yyyy")}
                      </div>
                      {typeof workout.duration === "number" && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration} min
                        </div>
                      )}
                      {typeof workout.caloriesBurned === "number" && (
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {workout.caloriesBurned} cal
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* right stats: hidden on mobile, shown below instead */}
                <div className="hidden text-sm text-muted-foreground sm:block">
                  {workout.exercises.length} exercises • {totalSets} sets
                </div>
              </div>

              {/* mobile stats row */}
              <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                {workout.exercises.length} exercises • {totalSets} sets
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {workout.exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="border-l-2 border-muted pl-3 sm:pl-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="font-medium truncate">
                          {exercise.name}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] sm:text-xs"
                        >
                          {exercise.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {exercise.sets.map((set, i) => (
                          <div
                            key={set.id}
                            className="text-xs text-muted-foreground sm:text-sm"
                          >
                            Set {i + 1}: {formatSetInfo(set)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
