"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import { goToWorkspace } from "./actions";

export function WorkspaceForm({ rootDomain }: { rootDomain: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(goToWorkspace, {});
  const [slug, setSlug] = useState("");
  const errors = state.fieldErrors?.slug;

  return (
    <form action={formAction} className="grid gap-4">
      <Field id="slug" label="Workspace URL" errors={errors}>
        <div className="flex items-center gap-1.5">
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-invalid={!!errors || undefined}
            aria-describedby={errors ? "slug-error" : undefined}
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
          />
          <span className="shrink-0 text-sm text-muted-foreground">.{rootDomain}</span>
        </div>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Continue
      </Button>
    </form>
  );
}
