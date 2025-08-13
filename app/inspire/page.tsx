import { AppLayout } from "@/components/app-layout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import InspireClient from "./inspire-client";

export default async function InspirePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppLayout user={{ name: user.name, email: user.email }}>
      <InspireClient />
    </AppLayout>
  );
}
