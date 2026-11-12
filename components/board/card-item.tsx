import { endOfDay, format, isPast, parseISO } from "date-fns";
import { CalendarDays, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import type { CardSummary } from "@/lib/types";

export function CardItem({ card, overlay }: { card: CardSummary; overlay?: boolean }) {
  const due = card.due_date ? parseISO(card.due_date) : null;
  const overdue = due ? isPast(endOfDay(due)) : false;

  return (
    <div
      className={cn(
        "grid gap-2 rounded-lg border bg-card p-2.5 text-sm shadow-xs",
        overlay && "rotate-2 shadow-lg ring-2 ring-ring/40",
      )}
    >
      <p className="break-words whitespace-pre-wrap">{card.title}</p>
      {(due || card.comments_count > 0 || card.assignee) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1 py-0.5",
                overdue && "bg-destructive/10 font-medium text-destructive",
              )}
            >
              <CalendarDays className="size-3" aria-hidden />
              <span className="sr-only">{overdue ? "Overdue, due" : "Due"}</span>
              {format(due, "MMM d")}
            </span>
          )}
          {card.comments_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden />
              <span className="sr-only">Comments:</span>
              {card.comments_count}
            </span>
          )}
          {card.assignee && (
            <Avatar className="ml-auto size-6" title={card.assignee.name}>
              <AvatarFallback className="text-[10px]">{initials(card.assignee.name)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  );
}
