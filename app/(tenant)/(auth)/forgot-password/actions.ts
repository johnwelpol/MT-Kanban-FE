"use server";

import { toFormState, type FormState } from "@/lib/form";
import { tenantApi } from "@/lib/laravel";

export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await tenantApi("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email: String(formData.get("email") ?? "") },
    });
  } catch (e) {
    return toFormState(e);
  }
  return { ok: true, message: "If that email belongs to a member of this workspace, we've sent a reset link." };
}
