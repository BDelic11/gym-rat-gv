// components/food/food-modal.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // ⬅ add
import { Loader2, Save, BookmarkPlus, X } from "lucide-react"; // ⬅ add
import { MealType } from "@prisma/client";

interface ParsedMeal {
  type: MealType;
  items: Array<{
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
  }>;
}

interface FoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealData: ParsedMeal | null;
  onSave: (meal: ParsedMeal) => Promise<void>;
  onSaveTemplate?: (meal: ParsedMeal, name?: string) => Promise<void>; // ⬅ NEW
  isLoading?: boolean;
}

export function FoodModal({
  isOpen,
  onClose,
  mealData,
  onSave,
  onSaveTemplate,
  isLoading,
}: FoodModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTpl, setIsSavingTpl] = useState(false); // ⬅
  const [tplName, setTplName] = useState<string>(""); // ⬅

  const handleSave = async () => {
    if (!mealData) return;
    setIsSaving(true);
    try {
      await onSave(mealData);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!mealData || !onSaveTemplate) return;
    setIsSavingTpl(true);
    try {
      await onSaveTemplate(mealData, tplName || undefined);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingTpl(false);
    }
  };

  const totalCalories =
    mealData?.items.reduce((s, i) => s + i.calories, 0) || 0;
  const totalProtein = mealData?.items.reduce((s, i) => s + i.protein, 0) || 0;
  const totalCarbs = mealData?.items.reduce((s, i) => s + i.carbs, 0) || 0;
  const totalFat = mealData?.items.reduce((s, i) => s + i.fat, 0) || 0;

  const getMealTypeLabel = (t: MealType) =>
    ({
      BREAKFAST: "Breakfast",
      LUNCH: "Lunch",
      DINNER: "Dinner",
      SNACK: "Snack",
    }[t] ?? "Meal");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Review {mealData ? getMealTypeLabel(mealData.type) : "Meal"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing meal...</span>
          </div>
        ) : mealData ? (
          <div className="space-y-4">
            {/* items */}
            <div className="space-y-3">
              {mealData.items.map((item, idx) => (
                <Card key={idx}>
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
                        <div className="font-medium">
                          {item.protein.toFixed(1)}g
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbs:</span>
                        <div className="font-medium">
                          {item.carbs.toFixed(1)}g
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fat:</span>
                        <div className="font-medium">
                          {item.fat.toFixed(1)}g
                        </div>
                      </div>
                    </div>
                    {(item.fiber || item.sugar || item.sodium) && (
                      <div className="grid grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t">
                        {item.fiber && (
                          <div>
                            <span className="text-muted-foreground">
                              Fiber:
                            </span>
                            <div className="font-medium">
                              {item.fiber.toFixed(1)}g
                            </div>
                          </div>
                        )}
                        {item.sugar && (
                          <div>
                            <span className="text-muted-foreground">
                              Sugar:
                            </span>
                            <div className="font-medium">
                              {item.sugar.toFixed(1)}g
                            </div>
                          </div>
                        )}
                        {item.sodium && (
                          <div>
                            <span className="text-muted-foreground">
                              Sodium:
                            </span>
                            <div className="font-medium">
                              {item.sodium.toFixed(0)}mg
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* totals */}
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
                      <div className="font-medium">
                        {totalProtein.toFixed(1)}g
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carbs:</span>
                      <div className="font-medium">
                        {totalCarbs.toFixed(1)}g
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fat:</span>
                      <div className="font-medium">{totalFat.toFixed(1)}g</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* template name (optional) */}
            {onSaveTemplate && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Template name (optional)
                </label>
                <Input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder={`e.g. ${mealData.items
                    .slice(0, 2)
                    .map((i) => i.name)
                    .join(" + ")}`}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No meal data to display</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isSavingTpl}
          >
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          {onSaveTemplate && (
            <Button
              variant="secondary"
              onClick={handleSaveTemplate}
              disabled={!mealData || isSavingTpl}
            >
              {isSavingTpl ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" /> Save as Template
                </>
              )}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!mealData || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Meal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
