import { AppLayout } from "@/components/app-layout";
import PageTitle from "@/components/page-title";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/data-access/data/get-user-profile";
import { ProfileModal } from "../../components/profile/profile-modal";
import { getWeightLogs } from "@/data-access/data/get-weight-logs";
import { WeightChart } from "@/components/weight-chart";
import { AddWeightEntry } from "@/components/profile/add-weight-entry";

export default async function ProfilePage() {
  const data = await getUserProfile();
  const weightLogs = await getWeightLogs();

  if (!data?.user) {
    redirect("/login");
  }

  const { profile } = data;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <PageTitle>Profile</PageTitle>
            <p className="text-muted-foreground">
              Manage your personal information and fitness goals.
            </p>
          </div>
          <ProfileModal existing={profile} />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Age</label>
              <p className="text-lg">
                {profile?.age ? `${profile.age} years` : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Weight</label>
              <p className="text-lg">
                {profile?.weight ? `${profile.weight} kg` : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Height</label>
              <p className="text-lg">
                {profile?.height ? `${profile.height} cm` : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Goal</label>
              <p className="text-lg">
                {profile?.goal ? formatGoal(profile.goal) : "Not set"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mx-10 flex items-center justify-between">
          <h3 className="font-semibold">Weight History</h3>
          <AddWeightEntry />
        </div>
        <WeightChart data={weightLogs} />
      </div>
    </AppLayout>
  );
}

function formatGoal(goal: string) {
  const mapping: Record<string, string> = {
    lose_weight: "Lose Weight",
    gain_weight: "Gain Weight",
    maintain: "Maintain",
    build_muscle: "Build Muscle",
  };
  return mapping[goal] || goal;
}
