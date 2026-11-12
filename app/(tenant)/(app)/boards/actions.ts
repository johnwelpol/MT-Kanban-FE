"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, tenantApi } from "@/lib/api";
import { toFormState, type FormState } from "@/lib/form";
import type { Board } from "@/lib/types";

export async function createBoard(_prev: FormState, formData: FormData): Promise<FormState> {
  const description = String(formData.get("description") ?? "").trim();
  let board: Board;
  try {
    board = await tenantApi<Board>("/boards", {
      method: "POST",
      body: { name: String(formData.get("name") ?? ""), ...(description && { description }) },
    });
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/boards", "layout");
  redirect(`/boards/${board.id}`);
}

export async function renameBoard(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await tenantApi(`/boards/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name: String(formData.get("name") ?? "") },
    });
  } catch (e) {
    return toFormState(e);
  }
  revalidatePath("/boards", "layout");
  return { ok: true };
}

export async function deleteBoard(id: string): Promise<FormState> {
  try {
    await tenantApi(`/boards/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.body?.message ?? "Couldn't delete the board." };
    throw e;
  }
  revalidatePath("/boards", "layout");
  redirect("/boards");
}
