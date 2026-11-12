"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import type { Board, Column } from "@/lib/types";

export function AddColumn({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setPending(true);
    try {
      const column = await apiFetch<Column>(`/boards/${boardId}/columns`, { method: "POST", json: { name: value } });
      queryClient.setQueryData<Board>(qk.board(boardId), (board) =>
        board && { ...board, columns: [...board.columns, column] },
      );
      setName("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the column.");
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-72 shrink-0 justify-start border-dashed" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add column
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid w-72 shrink-0 gap-2 self-start rounded-xl bg-muted/50 p-2">
      <Input
        aria-label="Column name"
        placeholder="Column name"
        value={name}
        maxLength={60}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Add column
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
