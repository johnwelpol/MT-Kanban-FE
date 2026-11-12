"use server";

import { revalidatePath } from "next/cache";
import { tenantApi } from "@/lib/api";
import { toFormState, type FormState } from "@/lib/form";

export async function renameWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await tenantApi("/workspace", { method: "PATCH", body: { name: String(formData.get("name") ?? "") } });
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Workspace renamed." };
}
