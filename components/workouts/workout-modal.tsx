"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Save, X } from "lucide-react"

interface ParsedWorkout {
  name: string
  duration?: number
  exercises: Array<{
    name: string
    category: "strength" | "cardio" | "flexibility" | "other"
    sets: Array<{
      reps?: number
      weight?: number
      duration?: number
      distance?: number
      restTime?: number
    }>
  }>
}

interface WorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  workoutData: ParsedWorkout | null
  onSave: (workout: ParsedWorkout) => Promise<void>
  isLoading?: boolean
}

export function WorkoutModal({ isOpen, onClose, workoutData, onSave, isLoading }: WorkoutModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!workoutData) return

    setIsSaving(true)
    try {
      await onSave(workoutData)
      onClose()
    } catch (error) {
      console.error("Error saving workout:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatSetInfo = (set: ParsedWorkout["exercises"][0]["sets"][0]) => {
    const parts = []
    if (set.reps) parts.push(`${set.reps} reps`)
    if (set.weight) parts.push(`${set.weight}kg`)
    if (set.duration) parts.push(`${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, "0")}`)
    if (set.distance) parts.push(`${set.distance}km`)
    if (set.restTime) parts.push(`${set.restTime}s rest`)
    return parts.join(" • ")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Workout</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing workout...</span>
          </div>
        ) : workoutData ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{workoutData.name}</h3>
              {workoutData.duration && (
                <p className="text-sm text-muted-foreground">Duration: {workoutData.duration} minutes</p>
              )}
            </div>

            <div className="space-y-4">
              {workoutData.exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium">{exercise.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.category}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          Set {setIndex + 1}: {formatSetInfo(set)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No workout data to display</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!workoutData || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Workout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
