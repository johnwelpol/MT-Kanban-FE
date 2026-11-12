"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { invite } from "@/app/(tenant)/(app)/settings/members/actions";
import { Field, FormMessage } from "@/components/form/field";
import { useMe } from "@/components/me-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormState } from "@/lib/form";
import { assignableRoles, ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export function InviteForm() {
  const me = useMe();
  const roles = assignableRoles(me.role);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(roles.includes("member") ? "member" : roles[0]);
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await invite(prev, formData);
    if (result.ok) setEmail("");
    return result;
  }, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
      <Field id="invite-email" label="Email" errors={errors.email}>
        <Input
          id="invite-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          placeholder="teammate@company.com"
          required
        />
      </Field>
      <Field id="invite-role" label="Role" errors={errors.role}>
        <Select
          name="role"
          items={Object.fromEntries(roles.map((r) => [r, ROLE_LABELS[r]]))}
          value={role}
          onValueChange={(v) => v && setRole(v as Role)}
        >
          <SelectTrigger id="invite-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit" disabled={pending} className="sm:mt-5.5">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Send invite
      </Button>
      {!state.fieldErrors && (
        <div className="sm:col-span-3">
          <FormMessage state={state} />
        </div>
      )}
    </form>
  );
}
