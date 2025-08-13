"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import googleIcon from "@/public/icons/google-icon.png";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";

import { useState } from "react";
import { loginSchema, LoginFormValues } from "@/schemas/auth";

type Props = React.ComponentPropsWithoutRef<"form"> & {
  onValidSubmit?: (data: LoginFormValues) => void | Promise<void>;
};

export function LoginForm({ className, onValidSubmit, ...props }: Props) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const values = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormValues;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }
    try {
      if (onValidSubmit) {
        await onValidSubmit(parsed.data);
      } else if ((props as any)?.action) {
        await (props as any).action(formData);
      }
    } catch (e: any) {
      setFormError(e?.message ?? "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Image
          src={logo}
          alt="Login Background"
          className="object-cover bg-transparent w-40 h-40 md:hidden"
          priority
        />
        <h1 className="text-2xl font-bold">Login to your gym account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            aria-invalid={!!errors.email}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            aria-invalid={!!errors.password}
            required
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
          {formError && (
            <p className="text-sm text-red-500" role="alert">
              {formError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        {/* <Button variant="outline" className="w-full" type="button">
          <Image
            src={googleIcon}
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2 rounded-full"
          />
          Login with Google
        </Button> */}
      </div>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/register" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  );
}
