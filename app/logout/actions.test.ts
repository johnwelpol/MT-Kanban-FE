import { beforeEach, describe, expect, it, vi } from "vitest";

const { tenantApi, destroy } = vi.hoisted(() => ({ tenantApi: vi.fn(), destroy: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/api", () => ({ tenantApi }));
vi.mock("@/lib/session", () => ({ getSession: async () => ({ destroy }) }));

const { logout } = await import("./actions");

beforeEach(() => {
  tenantApi.mockReset();
  destroy.mockReset();
});

describe("logout", () => {
  it("revokes the token, destroys the session and redirects to /login", async () => {
    tenantApi.mockResolvedValueOnce(undefined);
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(tenantApi).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
    expect(destroy).toHaveBeenCalled();
  });

  it("still destroys the session when revoking fails", async () => {
    tenantApi.mockRejectedValueOnce(new Error("down"));
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(destroy).toHaveBeenCalled();
  });
});
