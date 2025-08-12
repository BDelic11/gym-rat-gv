// src/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { addDays } from "date-fns";

const SESSION_COOKIE = "session_id";
const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const expiresAt = addDays(new Date(), SESSION_DAYS);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
}

export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await destroySession();
    return null;
  }
  return session.user;
}
