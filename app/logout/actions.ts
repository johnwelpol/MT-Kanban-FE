"use server";

import { redirect } from "next/navigation";
import { tenantApi } from "@/lib/laravel";
import { getSession } from "@/lib/session";

export async function logout() {
  try {
    await tenantApi("/auth/logout", { method: "POST" });
  } catch {
    // The token may already be invalid; the local session is cleared regardless.
  }
  (await getSession()).destroy();
  redirect("/login");
}
