export function MealSectionsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-12 w-full rounded bg-muted animate-pulse" />
            <div className="h-12 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
