"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, X } from "lucide-react"

interface ParsedMeal {
  type: "breakfast" | "lunch" | "dinner" | "snack" | "mid_meal"
  items: Array<{
    name: string
    quantity: number
    unit: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }>
}

interface FoodModalProps {
  isOpen: boolean
  onClose: () => void
  mealData: ParsedMeal | null
  onSave: (meal: ParsedMeal) => Promise<void>
  isLoading?: boolean
}

export function FoodModal({ isOpen, onClose, mealData, onSave, isLoading }: FoodModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!mealData) return

    setIsSaving(true)
    try {
      await onSave(mealData)
      onClose()
    } catch (error) {
      console.error("Error saving meal:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const totalCalories = mealData?.items.reduce((sum, item) => sum + item.calories, 0) || 0
  const totalProtein = mealData?.items.reduce((sum, item) => sum + item.protein, 0) || 0
  const totalCarbs = mealData?.items.reduce((sum, item) => sum + item.carbs, 0) || 0
  const totalFat = mealData?.items.reduce((sum, item) => sum + item.fat, 0) || 0

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "breakfast":
        return "Breakfast"
      case "lunch":
        return "Lunch"
      case "dinner":
        return "Dinner"
      case "snack":
        return "Snack"
      case "mid_meal":
        return "Mid-meal"
      default:
        return "Meal"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review {mealData ? getMealTypeLabel(mealData.type) : "Meal"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing meal...</span>
          </div>
        ) : mealData ? (
          <div className="space-y-4">
            {/* Meal Items */}
            <div className="space-y-3">
              {mealData.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <Badge variant="secondary">{item.calories} cal</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Protein:</span>
                        <div className="font-medium">{item.protein.toFixed(1)}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbs:</span>
                        <div className="font-medium">{item.carbs.toFixed(1)}g</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fat:</span>
                        <div className="font-medium">{item.fat.toFixed(1)}g</div>
                      </div>
                    </div>

                    {(item.fiber || item.sugar || item.sodium) && (
                      <div className="grid grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t">
                        {item.fiber && (
                          <div>
                            <span className="text-muted-foreground">Fiber:</span>
                            <div className="font-medium">{item.fiber.toFixed(1)}g</div>
                          </div>
                        )}
                        {item.sugar && (
                          <div>
                            <span className="text-muted-foreground">Sugar:</span>
                            <div className="font-medium">{item.sugar.toFixed(1)}g</div>
                          </div>
                        )}
                        {item.sodium && (
                          <div>
                            <span className="text-muted-foreground">Sodium:</span>
                            <div className="font-medium">{item.sodium.toFixed(0)}mg</div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Totals */}
            {mealData.items.length > 1 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Total Nutrition</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calories:</span>
                      <div className="font-bold text-lg">{totalCalories}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protein:</span>
                      <div className="font-medium">{totalProtein.toFixed(1)}g</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carbs:</span>
                      <div className="font-medium">{totalCarbs.toFixed(1)}g</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fat:</span>
                      <div className="font-medium">{totalFat.toFixed(1)}g</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No meal data to display</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!mealData || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Meal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
