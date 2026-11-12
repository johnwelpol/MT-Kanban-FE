import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "./env";
import { currentTenant, getTenantSession } from "./session";
import type { BoardSummary, Me, Workspace } from "./types";

export type ApiErrorBody = { message?: string; errors?: Record<string, string[]> } | null;

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body?.message ?? `Laravel responded with ${status}`);
    this.name = "ApiError";
  }
}

type RequestOptions = { method?: string; body?: unknown; tenant?: boolean; auth?: boolean };

async function request<T>(
  path: string,
  { method = "GET", body, tenant = false, auth = false }: RequestOptions,
): Promise<T> {
  const incoming = await headers();
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Internal-Key": env.INTERNAL_API_KEY,
  };
  const forwardedFor = incoming.get("x-forwarded-for");
  if (forwardedFor) h["X-Forwarded-For"] = forwardedFor;
  if (tenant) h["X-Tenant"] = (await currentTenant()).id;
  if (auth) {
    const session = await getTenantSession();
    if (!session) redirect("/login");
    h.Authorization = `Bearer ${session.token}`;
  }
  if (body !== undefined) h["Content-Type"] = "application/json";

  const res = await fetch(`${env.LARAVEL_INTERNAL_URL}/api${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && auth) redirect("/logout?expired=1");
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json);
  return json.data as T;
}

export function centralApi<T>(path: string, opts: Omit<RequestOptions, "tenant" | "auth"> = {}) {
  return request<T>(path, { ...opts, tenant: false, auth: false });
}

export function tenantApi<T>(path: string, opts: Omit<RequestOptions, "tenant"> = {}) {
  return request<T>(path, { auth: true, ...opts, tenant: true });
}

export const getMe = cache(() => tenantApi<Me>("/me"));

export const getBoards = cache(() => tenantApi<BoardSummary[]>("/boards"));

export const getPublicWorkspace = cache(() =>
  tenantApi<Workspace>("/workspace/public", { auth: false }),
);
