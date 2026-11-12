"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Board, CardSummary, Column } from "@/lib/types";
import { AddCard } from "./add-card";
import { CardItem } from "./card-item";
import { InlineEdit } from "./inline-edit";

function SortableCard({ card, canCard }: { card: CardSummary; canCard: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const isTemp = card.id.startsWith("temp-");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card" },
    disabled: !canCard || isTemp,
  });
  const open = () => !isTemp && router.push(`${pathname}?card=${encodeURIComponent(card.id)}`, { scroll: false });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      aria-roledescription={canCard ? "Draggable card" : "Card"}
      aria-label={card.title}
      onClick={open}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter") open();
      }}
    >
      <CardItem card={card} />
    </li>
  );
}

export function BoardColumn({
  boardId,
  column,
  canColumn,
  canCard,
}: {
  boardId: string;
  column: Column;
  canColumn: boolean;
  canCard: boolean;
}) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: !canColumn,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${column.id}`,
    data: { type: "column-body", columnId: column.id },
  });

  const setBoard = (fn: (board: Board) => Board) =>
    queryClient.setQueryData<Board>(qk.board(boardId), (board) => board && fn(board));

  const rename = async (name: string) => {
    const previous = column.name;
    setBoard((b) => ({ ...b, columns: b.columns.map((c) => (c.id === column.id ? { ...c, name } : c)) }));
    try {
      await apiFetch(`/boards/${boardId}/columns/${column.id}`, { method: "PATCH", json: { name } });
    } catch (e) {
      setBoard((b) => ({ ...b, columns: b.columns.map((c) => (c.id === column.id ? { ...c, name: previous } : c)) }));
      toast.error(e instanceof Error ? e.message : "Couldn't rename the column.");
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    const snapshot = queryClient.getQueryData<Board>(qk.board(boardId));
    setBoard((b) => ({ ...b, columns: b.columns.filter((c) => c.id !== column.id) }));
    try {
      await apiFetch(`/boards/${boardId}/columns/${column.id}`, { method: "DELETE" });
    } catch (e) {
      if (snapshot) queryClient.setQueryData(qk.board(boardId), snapshot);
      toast.error(e instanceof Error ? e.message : "Couldn't delete the column.");
    } finally {
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    }
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={column.name}
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/50 p-2",
        isDragging && "opacity-40",
      )}
    >
      <header className="flex items-center gap-1">
        {canColumn && (
          <button
            type="button"
            className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label={`Move column ${column.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}
        <h2 className="min-w-0 flex-1 text-sm font-medium">
          <InlineEdit value={column.name} label="column name" onSave={rename} disabled={!canColumn} maxLength={60} />
        </h2>
        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
        {canColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label={`Actions for column ${column.name}`}>
                  <MoreHorizontal aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ol
          ref={setDropRef}
          className={cn("grid min-h-12 content-start gap-2 overflow-y-auto rounded-lg", isOver && "bg-muted")}
        >
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} canCard={canCard} />
          ))}
        </ol>
      </SortableContext>

      {canCard && <AddCard boardId={boardId} columnId={column.id} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{column.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes {column.cards.length} {column.cards.length === 1 ? "card" : "cards"} and can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Delete column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
