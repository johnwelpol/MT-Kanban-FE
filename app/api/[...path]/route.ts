import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { currentTenant, getTenantSession } from "@/lib/session";

const ALLOWED = /^(boards|members|broadcasting\/auth)(\/|$)/;
const FORWARDED_HEADERS = ["content-type", "x-socket-id", "x-forwarded-for"];

const error = (status: number, message: string) => Response.json({ message }, { status });

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

async function handle(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  if (path.some((s) => s === "" || s === "." || s === ".." || /[/\\]/.test(s))) {
    return error(400, "Bad request.");
  }
  if (!ALLOWED.test(path.join("/"))) return error(404, "Not found.");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  if (hasBody && !isSameOrigin(req)) return error(403, "Forbidden.");

  const session = await getTenantSession();
  if (!session) return error(401, "Unauthenticated.");

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${session.token}`,
    "X-Tenant": (await currentTenant()).id,
    "X-Internal-Key": env.INTERNAL_API_KEY,
  });
  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetch(
    `${env.LARAVEL_INTERNAL_URL}/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
    {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    },
  );

  const resHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) resHeaders.set("content-type", contentType);
  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
