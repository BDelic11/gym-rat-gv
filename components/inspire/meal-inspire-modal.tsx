"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const FormSchema = z.object({
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"], {
    required_error: "Odaberi tip obroka.",
  }),
  include: z.string().max(1000).optional().or(z.literal("")),
  exclude: z.string().max(1000).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof FormSchema>;

type GeneratedItem = {
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

type GeneratedMeal = {
  title: string;
  type: MealType;
  items: GeneratedItem[];
  steps: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MealInspireModal({ open, onOpenChange }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedMeal | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mealType: undefined,
      include: "",
      exclude: "",
      notes: "",
    } as any,
  });

  const totals = useMemo(() => {
    if (!result) return { cal: 0, p: 0, c: 0, f: 0 };
    return result.items.reduce(
      (acc, i) => ({
        cal: acc.cal + (i.calories || 0),
        p: acc.p + (i.protein || 0),
        c: acc.c + (i.carbs || 0),
        f: acc.f + (i.fat || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }, [result]);

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      setResult(null);

      const res = await fetch("/api/inspire/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.error || "Neuspjelo generiranje jela.");

      setResult(json.meal as GeneratedMeal);
    } catch (e: any) {
      toast.error(e?.message || "Greška pri generiranju jela.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAsToday() {
    if (!result) return;
    try {
      const res = await fetch("/api/food/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: result.type, items: result.items }),
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.error || "Spremanje nije uspjelo.");
      toast.success("Dodano u današnje obroke.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Greška pri spremanju.");
    }
  }

  async function saveTemplate() {
    if (!result) return;
    try {
      const res = await fetch("/api/meal-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: result.type,
          items: result.items,
          name: result.title,
        }),
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.error || "Spremanje predloška nije uspjelo.");
      toast.success("Spremljeno kao template.");
    } catch (e: any) {
      toast.error(e?.message || "Greška pri spremanju predloška.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] mt-10 md:mt-0 max-h-[75vh] overflow-y-auto sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Generiraj obrok</DialogTitle>
        </DialogHeader>

        {/* Form */}
        {!result && (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mealType">Tip obroka</Label>
                <span className="text-destructive">*</span>
              </div>
              <Select
                onValueChange={(v: MealType) =>
                  form.setValue("mealType", v, { shouldValidate: true })
                }
              >
                <SelectTrigger id="mealType">
                  <SelectValue placeholder="Odaberi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Doručak</SelectItem>
                  <SelectItem value="LUNCH">Ručak</SelectItem>
                  <SelectItem value="DINNER">Večera</SelectItem>
                  <SelectItem value="SNACK">Međuobrok</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.mealType && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.mealType.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="include">Želim uključiti</Label>
              <Textarea
                id="include"
                placeholder="npr. piletina, riža, avokado..."
                {...form.register("include")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exclude">
                Želim isključiti{" "}
                <span className="text-muted-foreground">
                  (alergije, preferencije)
                </span>
              </Label>
              <Textarea
                id="exclude"
                placeholder="npr. gluten, laktoza, orašasti plodovi..."
                {...form.register("exclude")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Dodatne napomene</Label>
              <Textarea
                id="notes"
                placeholder="npr. visoki unos proteina, low-carb, brz recept..."
                {...form.register("notes")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Zatvori
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generiraj"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Result preview */}
        {result && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{result.title}</h3>
              <div className="mt-1 text-sm text-muted-foreground">
                Ukupno:{" "}
                <Badge variant="secondary" className="ml-1">
                  {Math.round(totals.cal)} kcal
                </Badge>
                <span className="ml-2">
                  P {totals.p.toFixed(1)}g • C {totals.c.toFixed(1)}g • F{" "}
                  {totals.f.toFixed(1)}g
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sastojci</h4>
              <ul className="space-y-2">
                {result.items.map((it, idx) => (
                  <li key={idx} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {it.quantity} {it.unit}
                        </div>
                      </div>
                      <Badge variant="outline">{it.calories} kcal</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      P {it.protein.toFixed(1)}g • C {it.carbs.toFixed(1)}g • F{" "}
                      {it.fat.toFixed(1)}g
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Koraci pripreme</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                {result.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            <DialogFooter className="flex flex-row  justify-between ">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Zatvori
              </Button>
              <div className="flex flex-row gap-4">
                <Button onClick={saveTemplate} className="w-auto md:w-full">
                  <Save className="h-4 w-4 mr-0 md:mr-2 " />
                  <span className="hidden md:block">Save template</span>
                </Button>
                <Button onClick={saveAsToday} className="w-auto md:w-full">
                  <CalendarPlus className="h-4 w-4 mr-0 md:mr-2" />
                  <span className="hidden md:block">Add as today meal</span>
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
