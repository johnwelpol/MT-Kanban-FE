import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, TENANT_ID_HEADER, TENANT_SLUG_HEADER } from "./constants";
import { env } from "./env";

export type SessionData = { token?: string; tenantId?: string; userId?: number };

const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE,
  password: env.SESSION_SECRET,
  ttl: 60 * 60 * 24 * 7,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function currentTenant(): Promise<{ id: string; slug: string }> {
  const h = await headers();
  const id = h.get(TENANT_ID_HEADER);
  const slug = h.get(TENANT_SLUG_HEADER);
  if (!id || !slug) throw new Error("No tenant resolved for this request");
  return { id, slug };
}

export async function getTenantSession() {
  const [session, tenant] = await Promise.all([getSession(), currentTenant()]);
  return session.token && session.tenantId === tenant.id ? session : null;
}
