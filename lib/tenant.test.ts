import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseHost, resolveTenant } from "./tenant";

describe("parseHost", () => {
  it.each([
    ["localhost:3000", { kind: "root" }],
    ["LOCALHOST", { kind: "root" }],
    ["www.localhost:3000", { kind: "root" }],
    ["acme.localhost:3000", { kind: "tenant", slug: "acme" }],
    ["Acme.LocalHost", { kind: "tenant", slug: "acme" }],
    ["api.localhost:3000", { kind: "root" }],
    ["a.b.localhost:3000", { kind: "root" }],
    ["evil.com", { kind: "root" }],
    ["acmelocalhost", { kind: "root" }],
    ["", { kind: "root" }],
    [null, { kind: "root" }],
  ])("%s → %o", (host, expected) => {
    expect(parseHost(host)).toEqual(expected);
  });
});

describe("resolveTenant", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("calls the internal resolve endpoint and caches the result", async () => {
    const ws = { id: "uuid-1", slug: "cache-hit", name: "Acme" };
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: ws }), { status: 200 }));

    expect(await resolveTenant("cache-hit")).toEqual(ws);
    expect(await resolveTenant("cache-hit")).toEqual(ws);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://127.0.0.1:8000/api/internal/tenants/resolve?slug=cache-hit");
    expect(init.headers["X-Internal-Key"]).toBe("test-internal-key");
    expect(init.cache).toBe("no-store");
  });

  it("caches a 404 as null", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 404 }));
    expect(await resolveTenant("missing")).toBeNull();
    expect(await resolveTenant("missing")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches after the 60s TTL", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => new Response("{}", { status: 404 }));
    await resolveTenant("ttl");
    vi.advanceTimersByTime(60_001);
    await resolveTenant("ttl");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache upstream failures", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    await expect(resolveTenant("flaky")).rejects.toThrow();
    await expect(resolveTenant("flaky")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
