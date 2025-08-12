"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ComponentType } from "react";

type Props = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
};

export function InspireCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative text-left focus:outline-none",
        "transition-transform active:scale-[0.98]"
      )}
    >
      <Card
        className={cn(
          "overflow-hidden border-muted/70 transition-all",
          "hover:shadow-lg hover:border-primary/30 focus-visible:shadow-lg",
          "ring-0 group-focus-visible:ring-2 group-focus-visible:ring-primary/50",
          className
        )}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border bg-muted/50 p-3 transition-colors group-hover:bg-muted">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* subtle “shine” on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-tr from-transparent via-transparent to-primary/5" />
    </button>
  );
}
