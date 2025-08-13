"use client";

import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  Settings,
  User,
  LightbulbIcon as Star,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";
import { useCurrentUser } from "@/hooks/use-current-user";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    name: "Food",
    href: "/food",
    icon: UtensilsCrossed,
  },
  {
    name: "Inspire",
    href: "/inspire",
    icon: Star,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
type SidebarUser = { name?: string | null; email?: string | null };

interface AppSidebarProps {
  className?: string;
  user?: SidebarUser | null;
}

export function AppSidebar({ className, user }: AppSidebarProps) {
  const pathname = usePathname();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-background border-r",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-transparent text-primary-foreground">
            {/* <Dumbbell className="h-4 w-4" /> */}
            <Image src={logo} alt="GYM AI Logo" className="w-full h-auto" />
          </div>
          {/* <span className="text-lg font-semibold">GYM RAT AI</span> */}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-md font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
