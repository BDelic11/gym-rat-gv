"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import googleIcon from "@/public/icons/google-icon.png";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";

import { useState } from "react";
import { registerSchema, RegisterFormValues } from "@/schemas/auth";
import { Loader2 } from "lucide-react";

type Props = React.ComponentPropsWithoutRef<"form"> & {
  onValidSubmit?: (data: RegisterFormValues) => void | Promise<void>;
};

export function RegisterForm({ className, onValidSubmit, ...props }: Props) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormValues, string>>
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
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirm: formData.get("confirm") as string,
    };

    const parsed = registerSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegisterFormValues;
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
      setFormError(e?.message ?? "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      {...props}
    >
      <div className="flex flex-col items-start gap-2 text-center">
        <Image
          src={logo}
          alt="Register Logo"
          className="object-cover bg-background-grey w-32 h-32 md:hidden"
          priority
        />
        <h1 className="text-2xl font-bold">Create your gym account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Fill in your details to get started
        </p>
      </div>

      <div className="grid gap-6">
        {/* Name */}
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            aria-invalid={!!errors.name}
            required
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            required
          />
          <p className="text-xs text-muted-foreground">
            Min 8 chars, incl. uppercase, lowercase, and a number.
          </p>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="grid gap-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirm}
            required
          />
          {errors.confirm && (
            <p className="text-sm text-red-500">{errors.confirm}</p>
          )}
        </div>

        {formError && (
          <p className="text-sm text-red-500" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </span>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        {/* <Button
          variant="outline"
          className="w-full"
          type="button"
          disabled={isSubmitting}
        >
          <Image
            src={googleIcon}
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2 rounded-full"
          />
          Sign up with Google
        </Button> */}
      </div>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/login" className="underline underline-offset-4">
          Login
        </a>
      </div>
    </form>
  );
}
