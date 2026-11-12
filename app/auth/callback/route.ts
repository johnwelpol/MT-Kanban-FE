import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { ApiError, tenantApi } from "@/lib/api";
import { startSession } from "@/lib/session";
import type { AuthResult } from "@/lib/types";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) redirect("/login?error=handoff");

  try {
    const result = await tenantApi<AuthResult>("/auth/handoff", { method: "POST", auth: false, body: { code } });
    await startSession(result);
  } catch (e) {
    if (e instanceof ApiError) redirect("/login?error=handoff");
    throw e;
  }
  redirect("/boards");
}
