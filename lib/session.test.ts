import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
const state = vi.hoisted(() => ({ tenantId: "tenant-a" }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => {
      if (value) jar.set(name, value);
      else jar.delete(name);
    },
  }),
  headers: async () => new Headers({ "x-tenant-id": state.tenantId, "x-tenant-slug": "acme" }),
}));

const { getTenantSession, startSession } = await import("./session");

beforeEach(() => {
  jar.clear();
  state.tenantId = "tenant-a";
});

describe("startSession / getTenantSession", () => {
  it("stores an encrypted session bound to the current tenant", async () => {
    await startSession({ token: "tok-123", user: { id: 7, name: "Ada", email: "ada@x.test" } });

    const raw = jar.get("session");
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("tok-123");

    const session = await getTenantSession();
    expect(session).toMatchObject({ token: "tok-123", tenantId: "tenant-a", userId: 7 });
  });

  it("does not accept the session on another tenant", async () => {
    await startSession({ token: "tok-123", user: { id: 7, name: "Ada", email: "ada@x.test" } });
    state.tenantId = "tenant-b";
    expect(await getTenantSession()).toBeNull();
  });

  it("returns null without a session", async () => {
    expect(await getTenantSession()).toBeNull();
  });
});
