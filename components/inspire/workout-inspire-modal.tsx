"use client";

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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function WorkoutInspireModal({ open, onOpenChange }: Props) {
  const [goal, setGoal] = useState<string | undefined>();
  const [include, setInclude] = useState("");
  const [exclude, setExclude] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string[] | null>(null);

  async function submit() {
    if (!goal) {
      toast.error("Odaberi cilj treninga.");
      return;
    }
    try {
      setLoading(true);
      setPlan(null);
      const res = await fetch("/api/inspire/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, include, exclude, notes }),
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.error || "Neuspjelo generiranje plana.");
      setPlan(json.steps as string[]);
    } catch (e: any) {
      toast.error(e?.message || "Greška pri generiranju plana.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Generiraj trening</DialogTitle>
        </DialogHeader>

        {!plan ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label>Cilj treninga</Label>
                <span className="text-destructive">*</span>
              </div>
              <Select onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Snaga</SelectItem>
                  <SelectItem value="hypertrophy">Hipertrofija</SelectItem>
                  <SelectItem value="endurance">Izdržljivost</SelectItem>
                  <SelectItem value="fatloss">Mršavljenje</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Želim uključiti</Label>
              <Textarea
                value={include}
                onChange={(e) => setInclude(e.target.value)}
                placeholder="npr. utezi, bench, traka..."
              />
            </div>

            <div className="grid gap-2">
              <Label>
                Želim isključiti{" "}
                <span className="text-muted-foreground">
                  (ozljede, limit opreme)
                </span>
              </Label>
              <Textarea
                value={exclude}
                onChange={(e) => setExclude(e.target.value)}
                placeholder="npr. čučanj, skokovi..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Napomene</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="npr. 45 min maksimalno, 3x tjedno..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Zatvori
              </Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generiraj"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium">Plan</h4>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              {plan.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <DialogFooter>
              <Button onClick={() => setPlan(null)} variant="outline">
                Natrag
              </Button>
              <Button onClick={() => onOpenChange(false)}>Zatvori</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
