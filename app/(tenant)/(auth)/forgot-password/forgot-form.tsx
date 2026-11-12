"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { forgotPassword } from "./actions";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(forgotPassword, {});
  const [email, setEmail] = useState("");
  const errors = state.fieldErrors?.email;

  return (
    <form action={formAction} className="grid gap-4">
      <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
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
      {!state.fieldErrors && <FormMessage state={state} />}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
