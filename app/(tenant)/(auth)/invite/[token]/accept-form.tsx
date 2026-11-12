"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { acceptInvite } from "./actions";

export function AcceptForm({ token, email, userExists }: { token: string; email: string; userExists: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(acceptInvite.bind(null, token), {});
  const [name, setName] = useState("");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="email" label="Email">
        <Input id="email" value={email} readOnly className="bg-muted" />
      </Field>
      {!userExists && (
        <Field id="name" label="Your name" errors={errors.name}>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            autoComplete="name"
            autoFocus
            required
          />
        </Field>
      )}
      <Field id="password" label="Password" errors={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          aria-invalid={!!errors.password || undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          autoComplete={userExists ? "current-password" : "new-password"}
          autoFocus={userExists}
          required
        />
      </Field>
      {!userExists && (
        <Field id="password_confirmation" label="Confirm password" errors={errors.password_confirmation}>
          <Input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
      )}
      {!state.fieldErrors && <FormMessage state={state} />}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {userExists ? "Sign in to accept" : "Accept invitation"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already a member?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
