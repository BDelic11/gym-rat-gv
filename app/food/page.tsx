import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import PageTitle from "@/components/page-title";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getCurrentUser } from "@/lib/auth";
import { getTodayMeals } from "@/lib/food";
import FoodClient from "./food-client";
import { MealSectionsSkeleton } from "@/components/food/meal-section-skeleton";

export default async function FoodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initialMeals = await getTodayMeals(user.id);

  return (
    <AppLayout user={user}>
      <div className="px-1 py-6 md:px-6 pb-32">
        <div className="px-2 md:px-0 mb-6">
          <PageTitle>Food</PageTitle>
          <p className="text-muted-foreground">
            Track your meals and nutrition.
          </p>
        </div>

        {/* Client bundle + skeleton for slow networks */}
        <Suspense
          fallback={
            <>
              <MealSectionsSkeleton />
              <div className="py-8">
                <LoadingSpinner size="sm" text="Loading meal tools..." />
              </div>
            </>
          }
        >
          <FoodClient initialMeals={initialMeals} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
