"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { use, useState } from "react";

interface SidebarUser {
  user?: { name?: string | null; email?: string | null } | null;
}

export function MobileNav({ user }: SidebarUser) {
  const [open, setOpen] = useState(false);
  if (!user) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-accent [&_svg]:h-6 [&_svg]:w-6 [&_svg]:[stroke-width:2] md:hidden"
        >
          <Menu />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <AppSidebar user={user} />
      </SheetContent>
    </Sheet>
  );
}
