"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { BoardSummary } from "@/lib/types";
import { Sidebar } from "./sidebar";

export function MobileNav({ boards }: { boards: BoardSummary[] }) {
  const pathname = usePathname();
  // Closes on navigation because the pathname no longer matches.
  const [openOn, setOpenOn] = useState<string | null>(null);

  return (
    <Sheet open={openOn === pathname} onOpenChange={(open) => setOpenOn(open ? pathname : null)}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu aria-hidden />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Sidebar boards={boards} />
      </SheetContent>
    </Sheet>
  );
}
