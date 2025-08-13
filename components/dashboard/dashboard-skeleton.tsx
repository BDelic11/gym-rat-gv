import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 3 x stat cards */}
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}

      {/* Protein progress card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
      </Card>

      {/* Achievements / streaks card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-52" />
        </CardContent>
      </Card>

      {/* Trends chart (wide) */}
      <Card className="md:col-span-2">
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
