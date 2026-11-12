"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import type { Board } from "@/lib/types";

export function useBoard(initialBoard: Board) {
  return useQuery({
    queryKey: qk.board(initialBoard.id),
    queryFn: () => apiFetch<Board>(`/boards/${encodeURIComponent(initialBoard.id)}`),
    initialData: initialBoard,
  });
}
