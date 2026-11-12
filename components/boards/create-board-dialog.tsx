"use client";

import { Loader2, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { createBoard } from "@/app/(tenant)/(app)/boards/actions";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form";

function CreateBoardForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBoard, {});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="board-name" label="Name" errors={errors.name}>
        <Input
          id="board-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name || undefined}
          maxLength={100}
          autoFocus
          required
        />
      </Field>
      <Field id="board-description" label="Description (optional)" errors={errors.description}>
        <Textarea
          id="board-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </Field>
      {!state.fieldErrors && <FormMessage state={state} />}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Create board
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateBoardDialog({ trigger }: { trigger?: React.ReactElement }) {
  const pathname = usePathname();
  // Remember where the dialog was opened so it closes itself after the redirect to the new board.
  const [openOn, setOpenOn] = useState<string | null>(null);

  return (
    <Dialog open={openOn === pathname} onOpenChange={(open) => setOpenOn(open ? pathname : null)}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="ghost" className="w-full justify-start">
              <Plus aria-hidden />
              New board
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>
        {openOn === pathname && <CreateBoardForm />}
      </DialogContent>
    </Dialog>
  );
}
