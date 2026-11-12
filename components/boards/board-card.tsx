"use client";

import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteBoard, renameBoard } from "@/app/(tenant)/(app)/boards/actions";
import { Field } from "@/components/form/field";
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import type { BoardSummary } from "@/lib/types";

function RenameForm({ board, onDone }: { board: BoardSummary; onDone: () => void }) {
  const [name, setName] = useState(board.name);
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await renameBoard(board.id, prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const errors = state.fieldErrors?.name;

  return (
    <form action={formAction} className="grid gap-4">
      <Field id={`rename-${board.id}`} label="Name" errors={errors ?? (state.message ? [state.message] : undefined)}>
        <Input
          id={`rename-${board.id}`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors || undefined}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BoardCard({ board, updatedLabel }: { board: BoardSummary; updatedLabel: string }) {
  const canRename = useCan("board.update");
  const canDelete = useCan("board.delete");
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [deleting, startDelete] = useTransition();

  const onDelete = () =>
    startDelete(async () => {
      const result = await deleteBoard(board.id);
      if (result && !result.ok) {
        toast.error(result.message ?? "Couldn't delete the board.");
        setDialog(null);
      }
    });

  return (
    <Card className="relative h-full transition-colors hover:bg-muted/40">
      <CardHeader className="pr-12">
        <CardTitle>
          <Link href={`/boards/${board.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {board.name}
          </Link>
        </CardTitle>
        {board.description && <CardDescription className="line-clamp-2">{board.description}</CardDescription>}
      </CardHeader>
      <CardFooter className="mt-auto justify-between text-xs text-muted-foreground">
        <span>
          {board.cards_count} {board.cards_count === 1 ? "card" : "cards"}
        </span>
        <span>Updated {updatedLabel}</span>
      </CardFooter>

      {(canRename || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2.5 right-2.5 z-10"
                aria-label={`Actions for ${board.name}`}
              >
                <MoreHorizontal aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {canRename && (
              <DropdownMenuItem onClick={() => setDialog("rename")}>
                <Pencil aria-hidden />
                Rename
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                <Trash2 aria-hidden />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={dialog === "rename"} onOpenChange={(open) => setDialog(open ? "rename" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
          </DialogHeader>
          {dialog === "rename" && <RenameForm board={board} onDone={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === "delete"} onOpenChange={(open) => !deleting && setDialog(open ? "delete" : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{board.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the board with all of its columns, cards and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" aria-hidden />}
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
