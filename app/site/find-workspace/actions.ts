"use server";

import { toFormState, type FormState } from "@/lib/form";
import { centralApi } from "@/lib/laravel";

export async function findWorkspaces(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await centralApi("/central/find-workspaces", {
      method: "POST",
      body: { email: String(formData.get("email") ?? "") },
    });
  } catch (e) {
    return toFormState(e);
  }
  return { ok: true, message: "If an account exists for that email, we've sent it a list of its workspaces." };
}
