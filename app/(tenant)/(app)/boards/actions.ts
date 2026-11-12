"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tenantApi } from "@/lib/api";
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
