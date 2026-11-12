"use client";

import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { slugify, validateSlug } from "@/lib/slug";
import { checkSlug, register, type SlugStatus } from "./actions";

const STATUS_TEXT: Record<SlugStatus | "checking", string> = {
  checking: "Checking availability…",
  available: "Available",
  taken: "That URL is already taken.",
  reserved: "That URL is reserved.",
  invalid: "Use 3–40 lowercase letters, numbers or hyphens, not starting or ending with a hyphen.",
  error: "Couldn't check availability right now.",
};

const BLOCKING: ReadonlySet<SlugStatus | "checking"> = new Set(["taken", "reserved", "invalid"]);

function SlugHint({ status }: { status: SlugStatus | "checking" }) {
  const Icon = status === "checking" ? Loader2 : status === "available" ? Check : X;
  return (
    <span
      aria-live="polite"
      className={`flex items-center gap-1 ${BLOCKING.has(status) ? "text-destructive" : ""}`}
    >
      <Icon className={`size-3.5 ${status === "checking" ? "animate-spin" : ""}`} aria-hidden />
      {STATUS_TEXT[status]}
    </span>
  );
}

export function RegisterForm({ rootDomain }: { rootDomain: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(register, {});
  const [values, setValues] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [workspaceName, setWorkspaceName] = useState("");
  const [slugInput, setSlugInput] = useState<string | null>(null);
  const [remote, setRemote] = useState<{ slug: string; status: SlugStatus } | null>(null);

  const slug = slugInput ?? slugify(workspaceName);
  const localProblem = slug ? validateSlug(slug) : null;
  const slugStatus: SlugStatus | "checking" | null = !slug
    ? null
    : (localProblem ?? (remote?.slug === slug ? remote.status : "checking"));

  useEffect(() => {
    if (!slug || validateSlug(slug)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const status = await checkSlug(slug);
      if (!cancelled) setRemote({ slug, status });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  const errors = state.fieldErrors ?? {};
  const text = (name: keyof typeof values) => ({
    id: name,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": !!errors[name] || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="name" label="Your name" errors={errors.name}>
        <Input {...text("name")} autoComplete="name" />
      </Field>
      <Field
        id="email"
        label="Email"
        errors={errors.email}
        hint="Already have an account? Use the same email and password to create another workspace."
      >
        <Input {...text("email")} type="email" autoComplete="email" required />
      </Field>
      <Field id="password" label="Password" errors={errors.password}>
        <Input {...text("password")} type="password" autoComplete="new-password" required />
      </Field>
      <Field id="password_confirmation" label="Confirm password" errors={errors.password_confirmation}>
        <Input {...text("password_confirmation")} type="password" autoComplete="new-password" />
      </Field>
      <Field id="workspace_name" label="Workspace name" errors={errors.workspace_name}>
        <Input
          id="workspace_name"
          name="workspace_name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          aria-invalid={!!errors.workspace_name || undefined}
          minLength={2}
          maxLength={60}
          required
        />
      </Field>
      <Field
        id="workspace_slug"
        label="Workspace URL"
        errors={errors.workspace_slug}
        hint={slugStatus && <SlugHint status={slugStatus} />}
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="workspace_slug"
            name="workspace_slug"
            value={slug}
            onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
            aria-invalid={!!errors.workspace_slug || (slugStatus !== null && BLOCKING.has(slugStatus)) || undefined}
            aria-describedby={errors.workspace_slug ? "workspace_slug-error" : "workspace_slug-hint"}
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            required
          />
          <span className="shrink-0 text-sm text-muted-foreground">.{rootDomain}</span>
        </div>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending || (slugStatus !== null && BLOCKING.has(slugStatus))}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Create workspace
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have a workspace?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
