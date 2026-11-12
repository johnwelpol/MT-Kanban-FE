import { beforeEach, describe, expect, it, vi } from "vitest";

const { tenantApi, startSession } = vi.hoisted(() => ({ tenantApi: vi.fn(), startSession: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), tenantApi }));
vi.mock("@/lib/session", () => ({ startSession }));

const { ApiError } = await import("@/lib/api");
const { login } = await import("./login/actions");
const { forgotPassword } = await import("./forgot-password/actions");
const { resetPassword } = await import("./reset-password/actions");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const auth = { token: "tok", user: { id: 1, name: "Ada", email: "ada@x.test" } };

beforeEach(() => {
  tenantApi.mockReset();
  startSession.mockReset();
});

describe("login", () => {
  it("signs in and redirects to a safe next path", async () => {
    tenantApi.mockResolvedValueOnce(auth);
    await expect(login({}, form({ email: "ada@x.test", password: "pw", next: "/boards/1" }))).rejects.toThrow(
      "REDIRECT:/boards/1",
    );
    expect(tenantApi).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      auth: false,
      body: { email: "ada@x.test", password: "pw" },
    });
    expect(startSession).toHaveBeenCalledWith(auth);
  });

  it("ignores an off-site next", async () => {
    tenantApi.mockResolvedValueOnce(auth);
    await expect(login({}, form({ email: "a", password: "b", next: "//evil.com" }))).rejects.toThrow(
      "REDIRECT:/boards",
    );
  });

  it("returns the email field error for bad credentials", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "Bad.", errors: { email: ["These credentials do not match."] } }));
    expect(await login({}, form({ email: "a", password: "b" }))).toMatchObject({
      fieldErrors: { email: ["These credentials do not match."] },
    });
    expect(startSession).not.toHaveBeenCalled();
  });
});

describe("forgotPassword", () => {
  it("always returns the neutral confirmation", async () => {
    tenantApi.mockResolvedValueOnce({ sent: true });
    expect(await forgotPassword({}, form({ email: "ada@x.test" }))).toEqual({
      ok: true,
      message: "If that email belongs to a member of this workspace, we've sent a reset link.",
    });
    expect(tenantApi).toHaveBeenCalledWith("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email: "ada@x.test" },
    });
  });

  it("surfaces throttling", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(429, { message: "Slow down." }));
    expect(await forgotPassword({}, form({ email: "a" }))).toEqual({ ok: false, message: "Slow down." });
  });
});

describe("resetPassword", () => {
  const fields = { token: "t", email: "ada@x.test", password: "newpass123", password_confirmation: "newpass123" };

  it("resets and redirects to /login?reset=1", async () => {
    tenantApi.mockResolvedValueOnce({ reset: true });
    await expect(resetPassword({}, form(fields))).rejects.toThrow("REDIRECT:/login?reset=1");
    expect(tenantApi).toHaveBeenCalledWith("/auth/reset-password", { method: "POST", auth: false, body: fields });
  });

  it("returns errors on 422", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "This password reset token is invalid.", errors: { email: ["This password reset token is invalid."] } }));
    expect(await resetPassword({}, form(fields))).toMatchObject({ ok: false, message: "This password reset token is invalid." });
  });
});
