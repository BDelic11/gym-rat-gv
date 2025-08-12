"use client";

import type React from "react";

import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import Image from "next/image";
import logo from "@/public/logos/gym-rat-transparent-logo.svg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <AppSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 justify-between items-center gap-4 border-b bg-background px-4 md:hidden">
          <MobileNav />
          <div className="flex items-center gap-2">
            {/* <span className="text-lg font-semibold">GYM AI</span> */}
            <Image src={logo} alt="GYM AI Logo" className="w-32 " />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
