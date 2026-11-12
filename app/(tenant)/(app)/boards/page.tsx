import { formatDistanceToNow } from "date-fns";
import { KanbanSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import { BoardCard } from "@/components/boards/board-card";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { Button } from "@/components/ui/button";
import { getBoards, getMe } from "@/lib/api";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Boards" };

export default async function BoardsPage() {
  const [me, boards] = await Promise.all([getMe(), getBoards()]);
  const canCreate = can(me, "board.create");
  const newBoardButton = (
    <Button>
      <Plus aria-hidden />
      New board
    </Button>
  );

  return (
    <div className="grid gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Boards</h1>
        {canCreate && boards.length > 0 && <CreateBoardDialog trigger={newBoardButton} />}
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <KanbanSquare className="size-8 text-muted-foreground" aria-hidden />
          <h2 className="font-medium">No boards yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {canCreate
              ? "Create a board to start organizing your team's work."
              : "Boards created by your team will show up here."}
          </p>
          {canCreate && <CreateBoardDialog trigger={newBoardButton} />}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <li key={board.id}>
              <BoardCard
                board={board}
                updatedLabel={formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
