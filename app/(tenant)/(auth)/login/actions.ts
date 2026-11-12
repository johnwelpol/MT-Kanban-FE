"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form";
import { tenantApi } from "@/lib/laravel";
import { startSession } from "@/lib/session";
import type { AuthResult } from "@/lib/types";
import { safeNext } from "@/lib/urls";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const result = await tenantApi<AuthResult>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") },
    });
    await startSession(result);
  } catch (e) {
    return toFormState(e);
  }
  redirect(safeNext(formData.get("next")));
}
