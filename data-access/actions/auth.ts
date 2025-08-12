"use server";

import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { createSession, destroySession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    // You can surface parsed.error.format() in the UI if you add a client hook
    throw new Error("Invalid credentials");
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error("Email or password is incorrect");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("Email or password is incorrect");
  }

  await createSession(user.id);
  redirect("/");
}

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) throw new Error("Invalid registration data");

  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      profile: { create: {} },
    },
  });

  await createSession(user.id);
  redirect("/profile-register");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
