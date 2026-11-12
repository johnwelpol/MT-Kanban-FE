"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form";
import { tenantApi } from "@/lib/api";

const FIELDS = ["token", "email", "password", "password_confirmation"];

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  try {
    await tenantApi("/auth/reset-password", { method: "POST", auth: false, body });
  } catch (e) {
    return toFormState(e);
  }
  redirect("/login?reset=1");
}
