"use server";

import { revalidatePath } from "next/cache";
import { ApiError, tenantApi } from "@/lib/api";
import { toFormState, type FormState } from "@/lib/form";
import type { Role } from "@/lib/types";

async function run(request: () => Promise<unknown>, success: string, fallback: string): Promise<FormState> {
  try {
    await request();
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.body?.message ?? fallback };
    throw e;
  }
  revalidatePath("/settings/members");
  return { ok: true, message: success };
}

export async function updateRole(userId: number, role: Role): Promise<FormState> {
  return run(
    () => tenantApi(`/members/${encodeURIComponent(userId)}`, { method: "PATCH", body: { role } }),
    "Role updated.",
    "Couldn't change the role.",
  );
}

export async function removeMember(userId: number): Promise<FormState> {
  return run(
    () => tenantApi(`/members/${encodeURIComponent(userId)}`, { method: "DELETE" }),
    "Member removed.",
    "Couldn't remove the member.",
  );
}

export async function revokeInvitation(id: string): Promise<FormState> {
  return run(
    () => tenantApi(`/invitations/${encodeURIComponent(id)}`, { method: "DELETE" }),
    "Invitation revoked.",
    "Couldn't revoke the invitation.",
  );
}

export async function invite(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  try {
    await tenantApi("/invitations", {
      method: "POST",
      body: { email, role: String(formData.get("role") ?? "") },
    });
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/settings/members");
  return { ok: true, message: `Invitation sent to ${email}.` };
}
