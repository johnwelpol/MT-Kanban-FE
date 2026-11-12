"use client";

import { KanbanSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { useCan, useMe } from "@/components/me-provider";
import { cn } from "@/lib/utils";
import type { BoardSummary } from "@/lib/types";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted",
        active && "bg-muted font-medium",
      )}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ boards }: { boards: BoardSummary[] }) {
  const pathname = usePathname();
  const me = useMe();
  const canUpdateWorkspace = useCan("workspace.update");
  const canCreateBoard = useCan("board.create");

  return (
    <div className="flex h-full flex-col gap-6 p-3">
      <div className="truncate px-2.5 pt-1 font-semibold">{me.workspace.name}</div>
      <nav aria-label="Main" className="grid gap-0.5">
        <NavLink href="/boards" active={pathname === "/boards"}>
          <KanbanSquare className="size-4" aria-hidden />
          Boards
        </NavLink>
        <NavLink href="/settings/members" active={pathname.startsWith("/settings/members")}>
          <Users className="size-4" aria-hidden />
          Members
        </NavLink>
        {canUpdateWorkspace && (
          <NavLink href="/settings/workspace" active={pathname.startsWith("/settings/workspace")}>
            <Settings className="size-4" aria-hidden />
            Workspace settings
          </NavLink>
        )}
      </nav>
      <div className="grid min-h-0 gap-1">
        <h2 className="px-2.5 text-xs font-medium text-muted-foreground">Boards</h2>
        <nav aria-label="Boards" className="grid gap-0.5 overflow-y-auto">
          {boards.map((board) => (
            <NavLink key={board.id} href={`/boards/${board.id}`} active={pathname.startsWith(`/boards/${board.id}`)}>
              <span className="truncate">{board.name}</span>
            </NavLink>
          ))}
          {boards.length === 0 && <p className="px-2.5 text-sm text-muted-foreground">No boards yet.</p>}
        </nav>
        {canCreateBoard && <CreateBoardDialog />}
      </div>
    </div>
  );
}
