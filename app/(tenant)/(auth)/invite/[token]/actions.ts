"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form";
import { ApiError, tenantApi } from "@/lib/laravel";
import { startSession } from "@/lib/session";
import type { AuthResult } from "@/lib/types";

const FIELDS = ["name", "password", "password_confirmation"];

export async function acceptInvite(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const body = Object.fromEntries(
    FIELDS.filter((f) => formData.has(f)).map((f) => [f, String(formData.get(f))]),
  );
  try {
    const result = await tenantApi<AuthResult>(`/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      auth: false,
      body,
    });
    await startSession(result);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      return { ok: false, message: "You're already a member of this workspace." };
    }
    return toFormState(e);
  }
  redirect("/boards");
}
