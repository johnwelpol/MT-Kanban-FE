"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form";
import { validateSlug } from "@/lib/slug";
import { resolveTenant } from "@/lib/tenant";
import { tenantUrl } from "@/lib/urls";

const NOT_FOUND: FormState = { ok: false, fieldErrors: { slug: ["We couldn't find that workspace."] } };

export async function goToWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (validateSlug(slug)) return NOT_FOUND;

  let found: boolean;
  try {
    found = (await resolveTenant(slug)) !== null;
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  if (!found) return NOT_FOUND;
  redirect(tenantUrl(slug, "/login"));
}
