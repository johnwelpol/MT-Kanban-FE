import { NextResponse, type NextRequest } from "next/server";
import {
  PUBLIC_TENANT_PATHS,
  SESSION_COOKIE,
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
} from "./lib/constants";
import { parseHost, resolveTenant } from "./lib/tenant";

export async function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete(TENANT_ID_HEADER);
  headers.delete(TENANT_SLUG_HEADER);
  const { pathname } = req.nextUrl;
  // Server action redirects are re-fetched internally via localhost; the original host survives in x-forwarded-host.
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = parseHost(forwardedHost || req.headers.get("host"));

  if (host.kind === "root") {
    const url = req.nextUrl.clone();
    url.pathname = `/site${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  if (pathname === "/site" || pathname.startsWith("/site/")) {
    return new NextResponse(null, { status: 404 });
  }

  const tenant = await resolveTenant(host.slug);
  if (!tenant) return NextResponse.rewrite(new URL("/tenant-not-found", req.url));
  headers.set(TENANT_ID_HEADER, tenant.id);
  headers.set(TENANT_SLUG_HEADER, tenant.slug);

  const hasSession = req.cookies.has(SESSION_COOKIE);
  const isApi = pathname.startsWith("/api/");
  const isPublic = PUBLIC_TENANT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isApi && !isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/boards", req.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
