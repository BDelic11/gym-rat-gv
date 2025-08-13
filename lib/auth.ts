"server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { addDays } from "date-fns";

const SESSION_COOKIE = "session_id";
const SESSION_DAYS = 14;

export async function createSession(userId: string) {
  const expiresAt = addDays(new Date(), SESSION_DAYS);
  const session = await prisma.session.create({ data: { userId, expiresAt } });

  cookies().set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
}

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function getCurrentUser(): Promise<PublicUser | null> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await destroySession();
    return null;
  }
  return session.user;
}
