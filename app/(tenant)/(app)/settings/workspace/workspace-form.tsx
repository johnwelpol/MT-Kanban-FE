"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { renameWorkspace } from "./actions";

export function WorkspaceForm({ name: initialName }: { name: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(renameWorkspace, {});
  const [name, setName] = useState(initialName);
  const errors = state.fieldErrors?.name;

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="workspace-name" label="Workspace name" errors={errors}>
        <Input
          id="workspace-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors || undefined}
          aria-describedby={errors ? "workspace-name-error" : undefined}
          minLength={2}
          maxLength={60}
          required
        />
      </Field>
      {!state.fieldErrors && <FormMessage state={state} />}
      <Button type="submit" className="justify-self-start" disabled={pending || name.trim() === initialName}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Save
      </Button>
    </form>
  );
}
