import { AppLayout } from "@/components/app-layout";
import PageTitle from "@/components/page-title";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <AppLayout user={user}>
      <div className="p-6">
        <div className="mb-6">
          <PageTitle>Settings</PageTitle>
          <p className="text-muted-foreground">
            Configure your app preferences.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">App Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Toggle dark/light theme
                </p>
              </div>
              <button className="text-sm text-primary hover:underline">
                Toggle
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Workout reminders and updates
                </p>
              </div>
              <button className="text-sm text-primary hover:underline">
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
