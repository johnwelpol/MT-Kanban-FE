"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" label="Email" errors={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          autoComplete="email"
          autoFocus
          required
        />
      </Field>
      <Field id="password" label="Password" errors={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          aria-invalid={!!errors.password || undefined}
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="-mt-2 text-right text-sm">
        <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>
      {!state.fieldErrors && <FormMessage state={state} />}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Log in
      </Button>
    </form>
  );
}
