"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { MealSection } from "@/components/food/meal-section";
import { VoiceInput } from "@/components/workouts/voice-input";
import { FoodModal } from "@/components/food/food-modal";
import { TemplateBrowserModal } from "@/components/food/template-browser-modal";
import { useToast } from "@/hooks/use-toast";
import PageTitle from "@/components/page-title";
import { transcribeAudio } from "@/lib/actions/workout-actions";
import type { MealType } from "@prisma/client";

// ----- Types -----
type ParsedMealItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};
type ParsedMeal = { type: MealType; items: ParsedMealItem[] };

type MealItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// ----- Labels -----
const MEAL_LABEL: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

// =====================================================

export default function FoodPage() {
  const { toast } = useToast();

  const [meals, setMeals] = useState<{
    breakfast: any[];
    lunch: any[];
    dinner: any[];
    snack: any[];
  }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  const [currentMealType, setCurrentMealType] = useState<MealType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [browseType, setBrowseType] = useState<MealType | null>(null);

  // ----- Load meals on mount -----
  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const res = await fetch("/api/meals", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load");
      setMeals(
        data.meals || { breakfast: [], lunch: [], dinner: [], snack: [] }
      );
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Could not load meals.",
        variant: "destructive",
      });
    }
  }

  // ----- API helpers -----
  async function apiParseFood(text: string, mealType: MealType) {
    const res = await fetch("/api/food/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mealType }),
    });
    return res.json();
  }

  async function apiSaveMeal(meal: ParsedMeal) {
    const res = await fetch("/api/food/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    });
    return res.json();
  }

  async function apiRemoveMealItem(itemId: string) {
    const res = await fetch(`/api/food/item?id=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    return res.json();
  }

  async function apiSaveTemplate(meal: ParsedMeal, name?: string) {
    const res = await fetch("/api/meal-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal, name }),
    });
    return res.json();
  }

  // ----- UI handlers -----
  function handleAddFood(mealType: string) {
    setCurrentMealType(mealType.toUpperCase() as MealType);
  }

  const handleVoiceInput = async (input: string, isVoice: boolean) => {
    if (!currentMealType) {
      toast({
        title: "Select Meal Type",
        description: "Click 'Add Food' on a meal section first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setIsModalOpen(true);
    setParsedMeal(null);

    try {
      let textToProcess = input;

      if (isVoice) {
        const tx = await transcribeAudio(input);
        if (!tx?.success) throw new Error(tx?.error || "Transcription failed");
        textToProcess = tx.text || "";
        toast({
          title: "Audio transcribed",
          description: `"${textToProcess}"`,
        });
      }

      const parsed = await apiParseFood(textToProcess, currentMealType);
      if (!parsed.success) throw new Error(parsed.error || "Parsing failed");
      setParsedMeal(parsed.meal || null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Processing error",
        description: err?.message || "Failed to process meal",
        variant: "destructive",
      });
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMeal = async (meal: ParsedMeal) => {
    const r = await apiSaveMeal(meal);
    if (r.success) {
      toast({ title: "Meal saved", description: "Added to today." });
      await loadMeals();
      setIsModalOpen(false);
      setParsedMeal(null);
      setCurrentMealType("");
    } else {
      toast({
        title: "Save error",
        description: r.error || "Failed to save meal",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async (meal: ParsedMeal, name?: string) => {
    const r = await apiSaveTemplate(meal, name);
    if (r.success) {
      toast({ title: "Template saved", description: "Added to your library." });
    } else {
      toast({
        title: "Error",
        description: r.error || "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const r = await apiRemoveMealItem(itemId);
    if (r.success) {
      toast({ title: "Item removed" });
      await loadMeals();
    } else {
      toast({
        title: "Remove error",
        description: r.error || "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // ----- Helpers -----
  const convertMealItems = (mealData: any[]): MealItem[] => {
    if (!Array.isArray(mealData)) return [];
    return mealData.flatMap((meal) =>
      (meal.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }))
    );
  };

  // =====================================================

  return (
    <AppLayout>
      <div className="p-6 pb-32">
        <div className="mb-6">
          <PageTitle>Food</PageTitle>
          <p className="text-muted-foreground">
            Track your meals and nutrition.
          </p>
        </div>

        <div className="space-y-6">
          <MealSection
            type="BREAKFAST"
            title="Breakfast"
            items={convertMealItems(meals.breakfast)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
            onBrowseTemplates={() => setBrowseType("BREAKFAST")} // ⬅ add this prop in MealSection
          />

          <MealSection
            type="LUNCH"
            title="Lunch"
            items={convertMealItems(meals.lunch)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
            onBrowseTemplates={() => setBrowseType("LUNCH")}
          />

          <MealSection
            type="DINNER"
            title="Dinner"
            items={convertMealItems(meals.dinner)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
            onBrowseTemplates={() => setBrowseType("DINNER")}
          />

          <MealSection
            type="SNACK"
            title="Snack"
            items={convertMealItems(meals.snack)}
            onAddFood={handleAddFood}
            onRemoveItem={handleRemoveItem}
            onBrowseTemplates={() => setBrowseType("SNACK")}
          />
        </div>

        <FoodModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setParsedMeal(null);
            setCurrentMealType("");
          }}
          mealData={parsedMeal}
          onSave={handleSaveMeal}
          onSaveTemplate={handleSaveTemplate} // ⬅ enables “Save as Template”
          isLoading={isProcessing}
        />
      </div>

      <VoiceInput
        onSubmit={handleVoiceInput}
        placeholder={
          currentMealType
            ? `Describe your ${MEAL_LABEL[currentMealType]}...`
            : "Click 'Add Food' on a meal section first, then describe what you ate..."
        }
        disabled={!currentMealType}
      />

      {/* Template picker */}
      {browseType && (
        <TemplateBrowserModal
          isOpen={!!browseType}
          mealType={browseType}
          onClose={() => setBrowseType(null)}
          onUsed={async () => {
            await loadMeals();
            toast({ title: "Added from template" });
          }}
        />
      )}
    </AppLayout>
  );
}
