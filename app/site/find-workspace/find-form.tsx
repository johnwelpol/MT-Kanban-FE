"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { findWorkspaces } from "./actions";

export function FindForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(findWorkspaces, {});
  const [email, setEmail] = useState("");
  const errors = state.fieldErrors?.email;

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="email" label="Email" errors={errors}>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors || undefined}
          aria-describedby={errors ? "email-error" : undefined}
          autoComplete="email"
          autoFocus
          required
        />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Email me my workspaces
      </Button>
    </form>
  );
}
