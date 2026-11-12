import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveTenant } = vi.hoisted(() => ({ resolveTenant: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/tenant", () => ({ resolveTenant }));

const { goToWorkspace } = await import("./actions");

const form = (slug: string) => {
  const fd = new FormData();
  fd.set("slug", slug);
  return fd;
};
const NOT_FOUND = { ok: false, fieldErrors: { slug: ["We couldn't find that workspace."] } };

beforeEach(() => resolveTenant.mockReset());

describe("goToWorkspace", () => {
  it("redirects to the workspace login when found", async () => {
    resolveTenant.mockResolvedValueOnce({ id: "w", slug: "acme", name: "Acme" });
    await expect(goToWorkspace({}, form("  Acme "))).rejects.toThrow("REDIRECT:http://acme.localhost:3000/login");
    expect(resolveTenant).toHaveBeenCalledWith("acme");
  });

  it("returns a field error when not found", async () => {
    resolveTenant.mockResolvedValueOnce(null);
    expect(await goToWorkspace({}, form("nope"))).toEqual(NOT_FOUND);
  });

  it("does not look up invalid slugs", async () => {
    expect(await goToWorkspace({}, form("a/../b"))).toEqual(NOT_FOUND);
    expect(resolveTenant).not.toHaveBeenCalled();
  });

  it("returns a message when the lookup fails", async () => {
    resolveTenant.mockRejectedValueOnce(new Error("down"));
    expect(await goToWorkspace({}, form("acme"))).toEqual({
      ok: false,
      message: "Something went wrong. Please try again.",
    });
  });
});
