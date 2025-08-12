"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { MealType } from "@prisma/client";

type TemplateItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealTemplate = {
  id: string;
  name: string;
  type: MealType;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
};

export function TemplateBrowserModal({
  isOpen,
  onClose,
  mealType,
  onUsed,
}: {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onUsed?: () => void; // callback after use
}) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meal-templates?type=${mealType}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setTemplates(data.templates || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, mealType]);

  const total = (t: MealTemplate) => {
    const cals = t.items.reduce((s, i) => s + i.calories, 0);
    const p = t.items.reduce((s, i) => s + i.protein, 0);
    const c = t.items.reduce((s, i) => s + i.carbs, 0);
    const f = t.items.reduce((s, i) => s + i.fat, 0);
    return { cals, p, c, f };
  };

  async function useTemplate(id: string) {
    await fetch("/api/meal-templates/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: id }),
    });
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/meal-templates/${id}`, { method: "DELETE" }); // optional if you add route
    load();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose from templates ({mealType})</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-muted-foreground py-6">No templates yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => {
              const { cals, p, c, f } = total(t);
              return (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.items.length} items
                        </div>
                      </div>
                      <Badge variant="secondary">{cals} cal</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">P:</span>{" "}
                        <span className="font-medium">{p.toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">C:</span>{" "}
                        <span className="font-medium">{c.toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">F:</span>{" "}
                        <span className="font-medium">{f.toFixed(1)}g</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => useTemplate(t.id)}>
                        <Plus className="h-4 w-4 mr-2" /> Use today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
