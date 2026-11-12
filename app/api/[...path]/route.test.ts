import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getTenantSession = vi.fn();
vi.mock("@/lib/session", () => ({
  currentTenant: async () => ({ id: "tenant-uuid", slug: "acme" }),
  getTenantSession: () => getTenantSession(),
}));

const route = await import("./route");

const fetchMock = vi.fn();
const HOST = "acme.localhost:3000";

function call(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string[],
  init: { headers?: Record<string, string>; body?: string; search?: string } = {},
) {
  const req = new NextRequest(`http://${HOST}/api/${path.join("/")}${init.search ?? ""}`, {
    method,
    body: init.body,
    headers: { host: HOST, ...init.headers },
  });
  return route[method](req, { params: Promise.resolve({ path }) });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  getTenantSession.mockResolvedValue({ token: "tok", tenantId: "tenant-uuid" });
});
afterEach(() => vi.unstubAllGlobals());

describe("path validation", () => {
  it.each([[["boards", ".."]], [["boards", "."]], [["boards", "a/../../internal"]], [["boards", "a\\b"]], [["boards", ""]]])(
    "rejects %o with 400",
    async (path) => {
      expect((await call("GET", path)).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([[["internal", "tenants", "resolve"]], [["me"]], [["boardsx"]], [["central", "register"]], [["broadcasting"]]])(
    "rejects non-allowlisted %o with 404",
    async (path) => {
      expect((await call("GET", path)).status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("origin check", () => {
  it("rejects a write without Origin", async () => {
    expect((await call("POST", ["boards"], { body: "{}" })).status).toBe(403);
  });

  it("rejects a write from another host", async () => {
    const res = await call("DELETE", ["boards", "b1"], { headers: { origin: "http://evil.localhost:3000" } });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed Origin", async () => {
    expect((await call("PATCH", ["boards", "b1"], { headers: { origin: "null" } })).status).toBe(403);
  });

  it("does not require Origin on GET", async () => {
    expect((await call("GET", ["boards"])).status).toBe(200);
  });
});

describe("session", () => {
  it("returns 401 JSON without a tenant session", async () => {
    getTenantSession.mockResolvedValue(null);
    const res = await call("GET", ["boards"]);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthenticated." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("forwarding", () => {
  it("forwards GET with query string and server-side auth headers", async () => {
    await call("GET", ["boards", "b 1"], {
      search: "?x=1",
      headers: { "x-forwarded-for": "203.0.113.7", authorization: "Bearer from-browser", cookie: "session=abc" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/api/boards/b%201?x=1");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.cache).toBe("no-store");
    const h: Headers = init.headers;
    expect(h.get("authorization")).toBe("Bearer tok");
    expect(h.get("x-tenant")).toBe("tenant-uuid");
    expect(h.get("x-internal-key")).toBe("test-internal-key");
    expect(h.get("accept")).toBe("application/json");
    expect(h.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(h.get("cookie")).toBeNull();
  });

  it("forwards a same-origin POST body, content type and socket id", async () => {
    await call("POST", ["broadcasting", "auth"], {
      body: '{"socket_id":"1.2"}',
      headers: { origin: `http://${HOST}`, "content-type": "application/json", "x-socket-id": "1.2" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/api/broadcasting/auth");
    expect(new TextDecoder().decode(init.body)).toBe('{"socket_id":"1.2"}');
    expect(init.headers.get("content-type")).toBe("application/json");
    expect(init.headers.get("x-socket-id")).toBe("1.2");
  });

  it("streams back status, body and content type only", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"Nope"}', {
        status: 422,
        headers: { "Content-Type": "application/json", "Set-Cookie": "laravel=1" },
      }),
    );
    const res = await call("GET", ["members"]);
    expect(res.status).toBe(422);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(await res.text()).toBe('{"message":"Nope"}');
  });

  it("passes 204 through", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const res = await call("DELETE", ["boards", "b1"], { headers: { origin: `http://${HOST}` } });
    expect(res.status).toBe(204);
  });
});
