"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, List } from "lucide-react";
import { MealType } from "@prisma/client";

interface MealItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSectionProps {
  type: MealType;
  title: string;
  items: MealItem[];
  onAddFood: (mealType: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onBrowseTemplates?: (mealType: MealType) => void; // ✅ new
}

export function MealSection({
  type,
  title,
  items,
  onAddFood,
  onRemoveItem,
  onBrowseTemplates,
}: MealSectionProps) {
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = items.reduce((sum, item) => sum + item.fat, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {totalCalories > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalCalories} cal
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onBrowseTemplates && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBrowseTemplates(type)}
                className="gap-2 rounded-full md:rounded-md"
              >
                <List className="h-4 w-4" />

                <span className="hidden md:block"> Templates</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddFood(type)}
              className="gap-2 rounded-full md:rounded-md"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:block">Add Food</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items logged</p>
        ) : (
          <div className="space-y-3">
            {/* Food Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({item.quantity}
                        {item.unit})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.calories} cal • P: {item.protein.toFixed(1)}g • C:{" "}
                      {item.carbs.toFixed(1)}g • F: {item.fat.toFixed(1)}g
                    </div>
                  </div>
                  {onRemoveItem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            {items.length > 1 && (
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total:</span>
                  <div className="text-right">
                    <div className="font-medium">{totalCalories} calories</div>
                    <div className="text-muted-foreground">
                      P: {totalProtein.toFixed(1)}g • C: {totalCarbs.toFixed(1)}
                      g • F: {totalFat.toFixed(1)}g
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
