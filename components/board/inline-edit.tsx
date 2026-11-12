"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function InlineEdit({
  value,
  label,
  onSave,
  disabled,
  maxLength,
  className,
}: {
  value: string;
  label: string;
  onSave: (next: string) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  if (disabled) return <span className={cn("truncate", className)}>{value}</span>;

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(value)}
        className={cn("truncate rounded-md px-1 -mx-1 text-left hover:bg-muted", className)}
        aria-label={`Edit ${label}`}
      >
        {value}
      </button>
    );
  }

  const commit = () => {
    const next = draft.trim();
    setDraft(null);
    if (next && next !== value) onSave(next);
  };

  return (
    <Input
      aria-label={label}
      value={draft}
      maxLength={maxLength}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
      className={cn("h-8", className)}
    />
  );
}
