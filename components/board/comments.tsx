"use client";

import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCan, useMe } from "@/components/me-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { initials } from "@/lib/utils";
import type { Card, Comment } from "@/lib/types";

export function Comments({ boardId, card }: { boardId: string; card: Card }) {
  const queryClient = useQueryClient();
  const me = useMe();
  const canComment = useCan("comment.create");
  const canModerate = useCan("comment.moderate");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const base = `/boards/${boardId}/cards/${card.id}/comments`;

  const setComments = (fn: (comments: Comment[]) => Comment[]) =>
    queryClient.setQueryData<Card>(qk.card(card.id), (c) => {
      if (!c) return c;
      const comments = fn(c.comments);
      return { ...c, comments, comments_count: comments.length };
    });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = body.trim();
    if (!value) return;
    setPending(true);
    try {
      const comment = await apiFetch<Comment>(base, { method: "POST", json: { body: value } });
      setComments((comments) => [...comments, comment]);
      setBody("");
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the comment.");
    } finally {
      setPending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`${base}/${id}`, { method: "DELETE" });
      setComments((comments) => comments.filter((c) => c.id !== id));
      queryClient.invalidateQueries({ queryKey: qk.board(boardId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the comment.");
    }
  };

  return (
    <section className="grid gap-3" aria-labelledby="comments-heading">
      <h3 id="comments-heading" className="text-sm font-medium">
        Comments
      </h3>
      {card.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      <ol className="grid gap-3">
        {card.comments.map((comment) => (
          <li key={comment.id} className="flex gap-2.5">
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px]">{initials(comment.author.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{comment.author.name}</span>
                <time className="text-muted-foreground" dateTime={comment.created_at}>
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </time>
                {(comment.author.id === me.user.id || canModerate) && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto"
                    aria-label="Delete comment"
                    onClick={() => remove(comment.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>
              <p className="text-sm break-words whitespace-pre-wrap">{comment.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {canComment && (
        <form onSubmit={add} className="grid gap-2">
          <Textarea
            aria-label="Write a comment"
            placeholder="Write a comment…"
            value={body}
            maxLength={5000}
            rows={2}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" size="sm" className="justify-self-start" disabled={pending || !body.trim()}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Comment
          </Button>
        </form>
      )}
    </section>
  );
}
