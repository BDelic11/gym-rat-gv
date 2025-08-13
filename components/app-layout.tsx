"use client";

import type React from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import Image from "next/image";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    // Lock the whole app to the viewport so only <main> can scroll
    <div className="fixed inset-0 flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <AppSidebar user={user} />
      </aside>

      {/* Main column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile Header (fixed, stays on top) */}
        <header
          className="
            fixed inset-x-0 top-0 z-40 md:hidden
            flex h-16 items-center justify-between gap-4
            border-b bg-background/95 backdrop-blur px-4
          "
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <MobileNav />
          <div className="flex items-center gap-2">
            <Image src={logo} alt="GYM AI Logo" className="w-32 h-auto" />
          </div>
        </header>

        {/* Scrollable content area */}
        <main
          className="
            flex-1 overflow-y-auto
            pt-16 md:pt-0
          "
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 4rem)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
