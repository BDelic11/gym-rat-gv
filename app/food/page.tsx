"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { MealSection } from "@/components/food/meal-section"
import { VoiceInput } from "@/components/workouts/voice-input"
import { FoodModal } from "@/components/food/food-modal"
import { useToast } from "@/hooks/use-toast"
import { transcribeAudio } from "@/lib/actions/workout-actions"
import { parseFoodText, saveMeal, getMeals, removeMealItem } from "@/lib/actions/food-actions"

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

interface MealItem {
  id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export default function FoodPage() {
  const [meals, setMeals] = useState<{
    breakfast: any[]
    lunch: any[]
    dinner: any[]
    snack: any[]
    mid_meal: any[]
  }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    mid_meal: [],
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMealType, setCurrentMealType] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadMeals()
  }, [])

  const loadMeals = async () => {
    const result = await getMeals()
    if (result.success) {
      setMeals(
        result.meals || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
          mid_meal: [],
        },
      )
    }
  }

  const handleAddFood = (mealType: string) => {
    setCurrentMealType(mealType)
    // This will be handled by the voice input at the bottom
  }

  const handleVoiceInput = async (input: string, isVoice: boolean) => {
    if (!currentMealType) {
      toast({
        title: "Select Meal Type",
        description: "Please click 'Add Food' on a meal section first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setIsModalOpen(true)
    setParsedMeal(null)

    try {
      let textToProcess = input

      if (isVoice) {
        // Transcribe audio first
        const transcriptionResult = await transcribeAudio(input)
        if (!transcriptionResult.success) {
          throw new Error(transcriptionResult.error)
        }
        textToProcess = transcriptionResult.text

        toast({
          title: "Audio Transcribed",
          description: `"${textToProcess}"`,
        })
      }

      // Parse the food text
      const parseResult = await parseFoodText(textToProcess, currentMealType)
      if (!parseResult.success) {
        throw new Error(parseResult.error)
      }

      setParsedMeal(parseResult.meal)
    } catch (error) {
      console.error("Error processing input:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process food",
        variant: "destructive",
      })
      setIsModalOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveMeal = async (meal: ParsedMeal) => {
    const result = await saveMeal(meal)
    if (result.success) {
      toast({
        title: "Meal Saved",
        description: "Your meal has been logged successfully!",
      })
      await loadMeals()
      setCurrentMealType("")
    } else {
      toast({
        title: "Save Error",
        description: result.error || "Failed to save meal",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeMealItem(itemId)
    if (result.success) {
      toast({
        title: "Item Removed",
        description: "Food item has been removed from your meal.",
      })
      await loadMeals()
    } else {
      toast({
        title: "Remove Error",
        description: result.error || "Failed to remove item",
        variant: "destructive",
      })
    }
  }

  // Convert meal data to the format expected by MealSection
  const convertMealItems = (mealData: any[]): MealItem[] => {
    return mealData.flatMap((meal) =>
      meal.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    )
  }

  return (
    <AppLayout>
      <div className="p-6 pb-32">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Food</h1>
          <p className="text-muted-foreground">Track your meals and nutrition.</p>
        </div>

        <div className="space-y-6">
          <MealSection
            type="breakfast"
            title="Breakfast"
            items={convertMealItems(meals.breakfast)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
          />

          <MealSection
            type="lunch"
            title="Lunch"
            items={convertMealItems(meals.lunch)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
          />

          <MealSection
            type="dinner"
            title="Dinner"
            items={convertMealItems(meals.dinner)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
          />

          <MealSection
            type="snack"
            title="Snack"
            items={convertMealItems(meals.snack)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
          />

          <MealSection
            type="mid_meal"
            title="Mid-meal"
            items={convertMealItems(meals.mid_meal)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        <FoodModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setCurrentMealType("")
          }}
          mealData={parsedMeal}
          onSave={handleSaveMeal}
          isLoading={isProcessing}
        />
      </div>

      <VoiceInput
        onSubmit={handleVoiceInput}
        placeholder={
          currentMealType
            ? `Describe your ${currentMealType}... (e.g., 'I had 2 eggs, 1 slice of toast with butter, and a glass of orange juice')`
            : "Click 'Add Food' on a meal section first, then describe what you ate..."
        }
        disabled={!currentMealType}
      />
    </AppLayout>
  )
}
