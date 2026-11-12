import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveTenant = vi.fn();
vi.mock("./lib/tenant", async (orig) => ({
  ...(await orig<typeof import("./lib/tenant")>()),
  resolveTenant: (slug: string) => resolveTenant(slug),
}));

const { proxy } = await import("./proxy");

const req = (url: string, init: { headers?: Record<string, string>; cookie?: string } = {}) => {
  const u = new URL(url);
  return new NextRequest(url, {
    headers: { host: u.host, ...(init.cookie ? { cookie: init.cookie } : {}), ...init.headers },
  });
};

const forwarded = (res: Response, name: string) => res.headers.get(`x-middleware-request-${name}`);

beforeEach(() => {
  resolveTenant.mockReset();
  resolveTenant.mockImplementation(async (slug: string) =>
    slug === "acme" ? { id: "tenant-uuid", slug: "acme", name: "Acme" } : null,
  );
});

describe("proxy on the root host", () => {
  it("rewrites / to /site", async () => {
    const res = await proxy(req("http://localhost:3000/"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/site");
  });

  it("rewrites /register to /site/register and strips spoofed tenant headers", async () => {
    const res = await proxy(
      req("http://localhost:3000/register", { headers: { "x-tenant-id": "spoof", "x-tenant-slug": "spoof" } }),
    );
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/site/register");
    expect(forwarded(res, "x-tenant-id")).toBeNull();
    expect(forwarded(res, "x-tenant-slug")).toBeNull();
  });
});

describe("proxy on a tenant host", () => {
  it("404s on /site paths", async () => {
    const res = await proxy(req("http://acme.localhost:3000/site"));
    expect(res.status).toBe(404);
  });

  it("rewrites unknown tenants to /tenant-not-found", async () => {
    const res = await proxy(req("http://nope.localhost:3000/boards"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://nope.localhost:3000/tenant-not-found");
  });

  it("redirects protected pages to /login with next when there is no session", async () => {
    const res = await proxy(req("http://acme.localhost:3000/boards"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://acme.localhost:3000/login?next=%2Fboards");
  });

  it("lets public paths through without a session and sets resolved tenant headers", async () => {
    const res = await proxy(
      req("http://acme.localhost:3000/invite/abc", { headers: { "x-tenant-id": "spoof" } }),
    );
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(forwarded(res, "x-tenant-id")).toBe("tenant-uuid");
    expect(forwarded(res, "x-tenant-slug")).toBe("acme");
  });

  it("does not treat a path that merely starts with a public prefix as public", async () => {
    const res = await proxy(req("http://acme.localhost:3000/login-other"));
    expect(res.status).toBe(307);
  });

  it("lets /api through without a session (the route answers 401)", async () => {
    const res = await proxy(req("http://acme.localhost:3000/api/boards"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets protected pages through with a session cookie", async () => {
    const res = await proxy(req("http://acme.localhost:3000/boards", { cookie: "session=sealed" }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects /login to /boards when a session cookie exists", async () => {
    const res = await proxy(req("http://acme.localhost:3000/login", { cookie: "session=sealed" }));
    expect(res.headers.get("location")).toBe("http://acme.localhost:3000/boards");
  });
});
