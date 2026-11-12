import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/board-view";
import { ApiError, tenantApi } from "@/lib/api";
import type { Board } from "@/lib/types";

export default async function BoardPage({ params }: PageProps<"/boards/[boardId]">) {
  const { boardId } = await params;

  let board: Board;
  try {
    board = await tenantApi<Board>(`/boards/${encodeURIComponent(boardId)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return <BoardView key={board.id} initialBoard={board} />;
}
