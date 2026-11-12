import { beforeEach, describe, expect, it, vi } from "vitest";

const { centralApi } = vi.hoisted(() => ({ centralApi: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/laravel", async (orig) => ({
  ...(await orig<typeof import("@/lib/laravel")>()),
  centralApi,
}));

const { ApiError } = await import("@/lib/laravel");
const { findWorkspaces } = await import("./actions");

const form = (email: string) => {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
};

beforeEach(() => centralApi.mockReset());

describe("findWorkspaces", () => {
  it("always returns the neutral confirmation on success", async () => {
    centralApi.mockResolvedValueOnce({ sent: true });
    expect(await findWorkspaces({}, form("ada@x.test"))).toEqual({
      ok: true,
      message: "If an account exists for that email, we've sent it a list of its workspaces.",
    });
    expect(centralApi).toHaveBeenCalledWith("/central/find-workspaces", {
      method: "POST",
      body: { email: "ada@x.test" },
    });
  });

  it("returns field errors on 422", async () => {
    centralApi.mockRejectedValueOnce(new ApiError(422, { message: "Bad.", errors: { email: ["Invalid."] } }));
    expect(await findWorkspaces({}, form("x"))).toMatchObject({ ok: false, fieldErrors: { email: ["Invalid."] } });
  });
});
