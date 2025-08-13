import { AppLayout } from "@/components/app-layout";
import PageTitle from "@/components/page-title";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkoutsClient from "@/app/workouts/workouts-client";

export default async function WorkoutsPage() {
  const user = await getCurrentUser();
  console.log("User in workouts page:", user);
  if (!user) redirect("/login");

  return (
    <AppLayout user={{ name: user.name, email: user.email }}>
      <div className="p-6 pb-32">
        <div className="mb-6">
          <PageTitle>Workouts</PageTitle>
          <p className="text-muted-foreground">
            Track and log your training sessions.
          </p>
        </div>
        <WorkoutsClient />
      </div>
    </AppLayout>
  );
}
