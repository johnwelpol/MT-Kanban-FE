"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteBoard } from "@/app/(tenant)/(app)/boards/actions";
import { useCan } from "@/components/me-provider";
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
import { useBoard } from "@/hooks/use-board";
import { apiFetch } from "@/lib/api-client";
import { applyColumnOrder, applyServerOrder, findCard, findColumnOfCard, moveCard, moveColumn } from "@/lib/board-ops";
import { qk } from "@/lib/query-keys";
import type { Board } from "@/lib/types";
import { AddColumn } from "./add-column";
import { BoardColumn } from "./board-column";
import { CardDialog } from "./card-dialog";
import { CardItem } from "./card-item";
import { InlineEdit } from "./inline-edit";

type Active = { type: "card" | "column"; id: string };

function targetColumnId(board: Board, overId: UniqueIdentifier, overType: unknown): string | undefined {
  const id = String(overId);
  if (overType === "column-body") return id.replace(/^drop:/, "");
  if (overType === "column") return id;
  return findColumnOfCard(board, id)?.id;
}

export function BoardView({ initialBoard }: { initialBoard: Board }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: board } = useBoard(initialBoard);
  const boardId = board.id;
  const canUpdate = useCan("board.update");
  const canDelete = useCan("board.delete");
  const canColumn = useCan("column.manage");
  const canCard = useCan("card.manage");

  const [draft, setDraft] = useState<Board | null>(null);
  const [active, setActive] = useState<Active | null>(null);
  const snapshot = useRef<Board | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const view = draft ?? board;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const restore = (previous: Board, message: string) => {
    queryClient.setQueryData(qk.board(boardId), previous);
    toast.error(message);
  };

  const moveCardMutation = useMutation({
    mutationFn: (v: { cardId: string; columnId: string; position: number; previous: Board }) =>
      apiFetch<{ columns: { id: string; card_ids: string[] }[] }>(`/boards/${boardId}/cards/${v.cardId}/move`, {
        method: "POST",
        json: { column_id: v.columnId, position: v.position },
      }),
    onSuccess: (data) =>
      queryClient.setQueryData<Board>(qk.board(boardId), (b) => b && applyServerOrder(b, data.columns)),
    onError: (e, v) => restore(v.previous, e.message || "Couldn't move the card."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.board(boardId) }),
  });

  const moveColumnMutation = useMutation({
    mutationFn: (v: { columnId: string; position: number; previous: Board }) =>
      apiFetch<{ column_ids: string[] }>(`/boards/${boardId}/columns/${v.columnId}/move`, {
        method: "POST",
        json: { position: v.position },
      }),
    onSuccess: (data) =>
      queryClient.setQueryData<Board>(qk.board(boardId), (b) => b && applyColumnOrder(b, data.column_ids)),
    onError: (e, v) => restore(v.previous, e.message || "Couldn't move the column."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.board(boardId) }),
  });

  const onDragStart = ({ active: a }: DragStartEvent) => {
    snapshot.current = board;
    setDraft(board);
    setActive({ type: a.data.current?.type === "column" ? "column" : "card", id: String(a.id) });
  };

  const onDragOver = ({ active: a, over }: DragOverEvent) => {
    if (!draft || !over || a.data.current?.type !== "card") return;
    const cardId = String(a.id);
    const fromColumn = findColumnOfCard(draft, cardId);
    const toColumnId = targetColumnId(draft, over.id, over.data.current?.type);
    if (!fromColumn || !toColumnId || fromColumn.id === toColumnId) return;
    const toColumn = draft.columns.find((c) => c.id === toColumnId)!;
    const overIndex = toColumn.cards.findIndex((c) => c.id === String(over.id));
    setDraft(moveCard(draft, cardId, toColumnId, overIndex === -1 ? toColumn.cards.length : overIndex));
  };

  const reset = () => {
    setDraft(null);
    setActive(null);
    snapshot.current = null;
  };

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    const previous = snapshot.current;
    const current = draft;
    reset();
    if (!previous || !current || !over) return;

    if (a.data.current?.type === "column") {
      const columnId = String(a.id);
      const toColumnId = targetColumnId(current, over.id, over.data.current?.type);
      const to = current.columns.findIndex((c) => c.id === toColumnId);
      const from = previous.columns.findIndex((c) => c.id === columnId);
      if (to === -1 || to === from) return;
      queryClient.setQueryData(qk.board(boardId), moveColumn(previous, columnId, to));
      moveColumnMutation.mutate({ columnId, position: to, previous });
      return;
    }

    const cardId = String(a.id);
    const toColumnId = targetColumnId(current, over.id, over.data.current?.type);
    const toColumn = current.columns.find((c) => c.id === toColumnId);
    if (!toColumn) return;
    const overIndex = toColumn.cards.findIndex((c) => c.id === String(over.id));
    const currentIndex = toColumn.cards.findIndex((c) => c.id === cardId);
    const position = overIndex === -1 ? (currentIndex === -1 ? toColumn.cards.length : currentIndex) : overIndex;

    const before = findColumnOfCard(previous, cardId);
    const beforeIndex = before?.cards.findIndex((c) => c.id === cardId);
    if (before?.id === toColumn.id && beforeIndex === position) return;

    queryClient.setQueryData(qk.board(boardId), moveCard(current, cardId, toColumn.id, position));
    moveCardMutation.mutate({ cardId, columnId: toColumn.id, position, previous });
  };

  const rename = async (name: string) => {
    const previous = board.name;
    queryClient.setQueryData<Board>(qk.board(boardId), (b) => b && { ...b, name });
    try {
      await apiFetch(`/boards/${boardId}`, { method: "PATCH", json: { name } });
      router.refresh();
    } catch (e) {
      queryClient.setQueryData<Board>(qk.board(boardId), (b) => b && { ...b, name: previous });
      toast.error(e instanceof Error ? e.message : "Couldn't rename the board.");
    }
  };

  const remove = () =>
    startDelete(async () => {
      const result = await deleteBoard(boardId);
      if (result && !result.ok) {
        toast.error(result.message ?? "Couldn't delete the board.");
        setConfirmDelete(false);
      }
    });

  const activeCard = active?.type === "card" ? findCard(view, active.id) : undefined;
  const activeColumn = active?.type === "column" ? view.columns.find((c) => c.id === active.id) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-6 py-4">
        <h1 className="min-w-0 text-xl font-semibold">
          <InlineEdit value={board.name} label="board name" onSave={rename} disabled={!canUpdate} maxLength={100} />
        </h1>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Board actions">
                  <MoreHorizontal aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={reset}
      >
        <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto px-6 pb-6">
          <SortableContext items={view.columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {view.columns.map((column) => (
              <BoardColumn key={column.id} boardId={boardId} column={column} canColumn={canColumn} canCard={canCard} />
            ))}
          </SortableContext>
          {canColumn && <AddColumn boardId={boardId} />}
        </div>
        <DragOverlay>
          {activeCard && <CardItem card={activeCard} overlay />}
          {activeColumn && (
            <div className="w-72 rounded-xl bg-muted p-3 text-sm font-medium shadow-lg ring-2 ring-ring/40">
              {activeColumn.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CardDialog boardId={boardId} />

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !deleting && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{board.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the board with all of its columns, cards and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" aria-hidden />}
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
