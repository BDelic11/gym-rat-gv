"server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return {
    user,
    profile,
  };
}
