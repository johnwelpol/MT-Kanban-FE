import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const getTenantSession = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("./session", () => ({
  currentTenant: async () => ({ id: "tenant-uuid", slug: "acme" }),
  getTenantSession: () => getTenantSession(),
}));

const { ApiError, centralApi, tenantApi } = await import("./laravel");

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  redirect.mockClear();
  getTenantSession.mockResolvedValue({ token: "tok", tenantId: "tenant-uuid" });
});
afterEach(() => vi.unstubAllGlobals());

describe("centralApi", () => {
  it("sends only the internal key and forwarded-for, and unwraps data", async () => {
    fetchMock.mockResolvedValue(json(200, { data: { available: true } }));

    await expect(centralApi("/central/slug-availability?slug=acme")).resolves.toEqual({ available: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/api/central/slug-availability?slug=acme");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toEqual({
      Accept: "application/json",
      "X-Internal-Key": "test-internal-key",
      "X-Forwarded-For": "203.0.113.7",
    });
  });
});

describe("tenantApi", () => {
  it("adds X-Tenant and Bearer token, and JSON-encodes the body", async () => {
    fetchMock.mockResolvedValue(json(201, { data: { id: "b1" } }));

    await tenantApi("/boards", { method: "POST", body: { name: "Roadmap" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Roadmap" }));
    expect(init.headers).toMatchObject({
      "X-Tenant": "tenant-uuid",
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  it("omits Authorization when auth is false", async () => {
    fetchMock.mockResolvedValue(json(200, { data: {} }));
    await tenantApi("/workspace/public", { auth: false });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(getTenantSession).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no tenant session", async () => {
    getTenantSession.mockResolvedValue(null);
    await expect(tenantApi("/me")).rejects.toThrow("REDIRECT:/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects to /logout?expired=1 on 401", async () => {
    fetchMock.mockResolvedValue(json(401, { message: "Unauthenticated." }));
    await expect(tenantApi("/me")).rejects.toThrow("REDIRECT:/logout?expired=1");
  });

  it("returns undefined on 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(tenantApi("/boards/b1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws ApiError with status and body on non-2xx", async () => {
    const body = { message: "Invalid.", errors: { name: ["Required."] } };
    fetchMock.mockResolvedValue(json(422, body));
    const err = await tenantApi("/boards", { method: "POST", body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, body });
  });
});
