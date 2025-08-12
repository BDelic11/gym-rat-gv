// app/onboarding/profile/page.tsx
import { AppLayout } from "@/components/app-layout";
import PageTitle from "@/components/page-title";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingProfileForm } from "@/components/profile-register-form";

export default async function OnboardingProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <PageTitle>Complete your profile</PageTitle>
          <p className="text-muted-foreground">
            We’ll use this to calculate your targets.
          </p>
        </div>
        <OnboardingProfileForm existing={profile} />
      </div>
    </AppLayout>
  );
}
