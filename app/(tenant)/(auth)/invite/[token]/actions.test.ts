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
const { acceptInvite } = await import("./actions");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const auth = { token: "tok", user: { id: 2, name: "Bo", email: "bo@x.test" } };

beforeEach(() => {
  tenantApi.mockReset();
  startSession.mockReset();
});

describe("acceptInvite", () => {
  it("creates a new account, signs in and redirects to /boards", async () => {
    tenantApi.mockResolvedValueOnce(auth);
    const fields = { name: "Bo", password: "secret123", password_confirmation: "secret123" };
    await expect(acceptInvite("a/b", {}, form(fields))).rejects.toThrow("REDIRECT:/boards");
    expect(tenantApi).toHaveBeenCalledWith("/invites/a%2Fb/accept", { method: "POST", auth: false, body: fields });
    expect(startSession).toHaveBeenCalledWith(auth);
  });

  it("sends only the password for an existing account", async () => {
    tenantApi.mockResolvedValueOnce(auth);
    await expect(acceptInvite("tok", {}, form({ password: "secret123" }))).rejects.toThrow("REDIRECT:/boards");
    expect(tenantApi.mock.calls[0][1].body).toEqual({ password: "secret123" });
  });

  it("explains a 409", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(409, { message: "Already a member." }));
    expect(await acceptInvite("tok", {}, form({ password: "x" }))).toEqual({
      ok: false,
      message: "You're already a member of this workspace.",
    });
  });

  it("returns field errors on 422", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "Bad.", errors: { password: ["Wrong."] } }));
    expect(await acceptInvite("tok", {}, form({ password: "x" }))).toMatchObject({ fieldErrors: { password: ["Wrong."] } });
  });
});
