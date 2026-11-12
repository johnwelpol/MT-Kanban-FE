"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import type { Board, CardSummary } from "@/lib/types";

export function AddCard({ boardId, columnId }: { boardId: string; columnId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const updateColumn = (fn: (cards: CardSummary[]) => CardSummary[]) =>
    queryClient.setQueryData<Board>(qk.board(boardId), (board) =>
      board && {
        ...board,
        columns: board.columns.map((c) => (c.id === columnId ? { ...c, cards: fn(c.cards) } : c)),
      },
    );

  const submit = async () => {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    const tempId = `temp-${crypto.randomUUID()}`;
    updateColumn((cards) => [
      ...cards,
      {
        id: tempId,
        board_id: boardId,
        column_id: columnId,
        title: value,
        position: cards.length,
        assignee: null,
        due_date: null,
        comments_count: 0,
      },
    ]);
    try {
      const card = await apiFetch<CardSummary>(`/boards/${boardId}/cards`, {
        method: "POST",
        json: { column_id: columnId, title: value },
      });
      updateColumn((cards) => cards.map((c) => (c.id === tempId ? card : c)));
    } catch (e) {
      updateColumn((cards) => cards.filter((c) => c.id !== tempId));
      toast.error(e instanceof Error ? e.message : "Couldn't add the card.");
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add card
      </Button>
    );
  }

  return (
    <div className="grid gap-2">
      <Textarea
        aria-label="Card title"
        placeholder="Card title"
        value={title}
        maxLength={200}
        rows={2}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit}>
          Add card
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
