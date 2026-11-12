"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import type { Card, Member } from "@/lib/types";
import { Comments } from "./comments";
import { InlineEdit } from "./inline-edit";

type CardPatch = Partial<{ title: string; description: string | null; assignee_id: number | null; due_date: string | null }>;

function DescriptionEditor({ card, onSave }: { card: Card; onSave: (description: string | null) => void }) {
  const [value, setValue] = useState(card.description ?? "");
  const dirty = value !== (card.description ?? "");
  return (
    <div className="grid gap-2">
      <Textarea
        id="card-description"
        value={value}
        maxLength={10000}
        rows={4}
        placeholder="Add a more detailed description…"
        onChange={(e) => setValue(e.target.value)}
      />
      {dirty && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(value.trim() || null)}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setValue(card.description ?? "")}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function CardDetails({ boardId, card, onClose }: { boardId: string; card: Card; onClose: () => void }) {
  const queryClient = useQueryClient();
  const canEdit = useCan("card.manage");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: members } = useQuery({
    queryKey: qk.members(),
    queryFn: () => apiFetch<Member[]>("/members"),
    enabled: canEdit,
  });
  const path = `/boards/${boardId}/cards/${card.id}`;

  const patch = async (fields: CardPatch) => {
    try {
      const updated = await apiFetch<Card>(path, { method: "PATCH", json: fields });
      queryClient.setQueryData(qk.card(card.id), updated);
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the card.");
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await apiFetch(path, { method: "DELETE" });
      onClose();
      queryClient.removeQueries({ queryKey: qk.card(card.id) });
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the card.");
    }
  };

  const assigneeItems: Record<string, string> = {
    none: "Unassigned",
    ...Object.fromEntries((members ?? []).map((m) => [String(m.user.id), m.user.name])),
    ...(card.assignee && { [String(card.assignee.id)]: card.assignee.name }),
  };

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle className="text-lg">
          <InlineEdit value={card.title} label="card title" onSave={(title) => patch({ title })} disabled={!canEdit} maxLength={200} />
        </DialogTitle>
        <DialogDescription className="sr-only">Card details</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="card-assignee">Assignee</Label>
          {canEdit ? (
            <Select
              items={assigneeItems}
              value={card.assignee ? String(card.assignee.id) : "none"}
              onValueChange={(v) => patch({ assignee_id: v === "none" || v == null ? null : Number(v) })}
            >
              <SelectTrigger id="card-assignee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(assigneeItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">{card.assignee?.name ?? "Unassigned"}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="card-due">Due date</Label>
          {canEdit ? (
            <div className="flex gap-1.5">
              <Input
                id="card-due"
                type="date"
                value={card.due_date ?? ""}
                onChange={(e) => patch({ due_date: e.target.value || null })}
              />
              {card.due_date && (
                <Button variant="ghost" size="icon" aria-label="Clear due date" onClick={() => patch({ due_date: null })}>
                  <X aria-hidden />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm">{card.due_date ? format(parseISO(card.due_date), "PPP") : "No due date"}</p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="card-description">Description</Label>
        {canEdit ? (
          <DescriptionEditor key={card.updated_at} card={card} onSave={(description) => patch({ description })} />
        ) : (
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{card.description || "No description."}</p>
        )}
      </div>

      <Comments boardId={boardId} card={card} />

      {canEdit && (
        <>
          <Button variant="destructive" size="sm" className="justify-self-start" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden />
            Delete card
          </Button>
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                <AlertDialogDescription>The card and its comments will be permanently deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={remove}>
                  Delete card
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}

export function CardDialog({ boardId }: { boardId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const cardId = useSearchParams().get("card");
  const close = () => router.replace(pathname, { scroll: false });

  const { data: card, error } = useQuery({
    queryKey: qk.card(cardId ?? ""),
    queryFn: () => apiFetch<Card>(`/boards/${boardId}/cards/${encodeURIComponent(cardId!)}`),
    enabled: !!cardId,
    retry: (count, e) => !(e instanceof ApiClientError && e.status === 404) && count < 2,
  });

  const notFound = error instanceof ApiClientError && error.status === 404;
  useEffect(() => {
    if (!notFound) return;
    toast.error("That card no longer exists.");
    router.replace(pathname, { scroll: false });
  }, [notFound, pathname, router]);

  return (
    <Dialog open={!!cardId && !notFound} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {card ? (
          <CardDetails boardId={boardId} card={card} onClose={close} />
        ) : error && !notFound ? (
          <p className="text-sm text-destructive">Couldn&apos;t load this card.</p>
        ) : (
          <div className="grid gap-3" aria-busy="true" aria-label="Loading card">
            <DialogTitle className="sr-only">Loading card</DialogTitle>
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-9" />
            <Skeleton className="h-24" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
