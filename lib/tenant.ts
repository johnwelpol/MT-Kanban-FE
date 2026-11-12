import { RESERVED_SLUGS } from "./slug";
import type { Workspace } from "./types";

export type HostInfo = { kind: "root" } | { kind: "tenant"; slug: string };

export function parseHost(host: string | null): HostInfo {
  const root = (process.env.ROOT_DOMAIN ?? "").toLowerCase();
  const name = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  const suffix = `.${root}`;

  if (!root || name === root || name === `www.${root}` || !name.endsWith(suffix)) {
    return { kind: "root" };
  }
  const slug = name.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || RESERVED_SLUGS.has(slug)) return { kind: "root" };
  return { kind: "tenant", slug };
}

const TTL_MS = 60_000;
const cache = new Map<string, { value: Workspace | null; expiresAt: number }>();

export async function resolveTenant(slug: string): Promise<Workspace | null> {
  const hit = cache.get(slug);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const url = `${process.env.INTERNAL_API_URL}/api/internal/tenants/resolve?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Internal-Key": process.env.INTERNAL_API_KEY ?? "" },
    cache: "no-store",
  });

  let value: Workspace | null;
  if (res.status === 404) value = null;
  else if (res.ok) value = ((await res.json()) as { data: Workspace }).data;
  else throw new Error(`Tenant resolve failed with ${res.status}`);

  cache.set(slug, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}
