"use server";

import { redirect } from "next/navigation";
import { toFormState, type FormState } from "@/lib/form";
import { centralApi } from "@/lib/api";
import { validateSlug } from "@/lib/slug";
import type { Workspace } from "@/lib/types";
import { tenantUrl } from "@/lib/urls";

export type SlugStatus = "available" | "taken" | "invalid" | "reserved" | "error";

export async function checkSlug(slug: string): Promise<SlugStatus> {
  if (typeof slug !== "string") return "invalid";
  const problem = validateSlug(slug);
  if (problem) return problem;
  try {
    const result = await centralApi<{ available: boolean; reason: SlugStatus | null }>(
      `/central/slug-availability?slug=${encodeURIComponent(slug)}`,
    );
    return result.available ? "available" : (result.reason ?? "taken");
  } catch {
    return "error";
  }
}

const FIELDS = ["name", "email", "password", "password_confirmation", "workspace_name", "workspace_slug"];

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));

  let result: { workspace: Workspace; handoff_code: string };
  try {
    result = await centralApi("/central/register", { method: "POST", body });
  } catch (e) {
    return toFormState(e);
  }
  redirect(tenantUrl(result.workspace.slug, `/auth/callback?code=${encodeURIComponent(result.handoff_code)}`));
}
