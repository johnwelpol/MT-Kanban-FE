import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  session.destroy();
  redirect(req.nextUrl.searchParams.has("expired") ? "/login?expired=1" : "/login");
}
