"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { resetPassword } from "./actions";

export function ResetForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-muted-foreground">
        Choose a new password for <span className="font-medium text-foreground">{email}</span>.
      </p>
      <Field id="password" label="New password" errors={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          aria-invalid={!!errors.password || undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          autoComplete="new-password"
          autoFocus
          required
        />
      </Field>
      <Field id="password_confirmation" label="Confirm new password" errors={errors.password_confirmation}>
        <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required />
      </Field>
      {(errors.email || errors.token || !state.fieldErrors) && <FormMessage state={state} />}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Update password
      </Button>
    </form>
  );
}
