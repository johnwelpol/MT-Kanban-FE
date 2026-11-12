import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tenantApi, startSession } = vi.hoisted(() => ({ tenantApi: vi.fn(), startSession: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/laravel", async (orig) => ({ ...(await orig<typeof import("@/lib/laravel")>()), tenantApi }));
vi.mock("@/lib/session", () => ({ startSession }));

const { ApiError } = await import("@/lib/laravel");
const { GET } = await import("./route");

const call = (search: string) => GET(new NextRequest(`http://acme.localhost:3000/auth/callback${search}`));
const auth = { token: "tok", user: { id: 1, name: "Ada", email: "ada@x.test" } };

beforeEach(() => {
  tenantApi.mockReset();
  startSession.mockReset();
});

describe("GET /auth/callback", () => {
  it("exchanges the code, starts the session and redirects to /boards", async () => {
    tenantApi.mockResolvedValueOnce(auth);
    await expect(call("?code=abc")).rejects.toThrow("REDIRECT:/boards");
    expect(tenantApi).toHaveBeenCalledWith("/auth/handoff", { method: "POST", auth: false, body: { code: "abc" } });
    expect(startSession).toHaveBeenCalledWith(auth);
  });

  it("redirects to /login?error=handoff when the code is rejected", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "Invalid code." }));
    await expect(call("?code=used")).rejects.toThrow("REDIRECT:/login?error=handoff");
    expect(startSession).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=handoff without a code", async () => {
    await expect(call("")).rejects.toThrow("REDIRECT:/login?error=handoff");
    expect(tenantApi).not.toHaveBeenCalled();
  });
});
