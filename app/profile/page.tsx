import { AppLayout } from "@/components/app-layout"

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and fitness goals.</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Age</label>
              <p className="text-lg">30 years</p>
            </div>
            <div>
              <label className="text-sm font-medium">Weight</label>
              <p className="text-lg">75 kg</p>
            </div>
            <div>
              <label className="text-sm font-medium">Height</label>
              <p className="text-lg">175 cm</p>
            </div>
            <div>
              <label className="text-sm font-medium">Goal</label>
              <p className="text-lg">Build Muscle</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
