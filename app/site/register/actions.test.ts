import { beforeEach, describe, expect, it, vi } from "vitest";

const { centralApi } = vi.hoisted(() => ({ centralApi: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  centralApi,
}));

const { ApiError } = await import("@/lib/api");
const { checkSlug, register } = await import("./actions");

beforeEach(() => centralApi.mockReset());

describe("checkSlug", () => {
  it("rejects invalid and reserved slugs without calling the API", async () => {
    expect(await checkSlug("A!")).toBe("invalid");
    expect(await checkSlug("admin")).toBe("reserved");
    expect(await checkSlug(42 as unknown as string)).toBe("invalid");
    expect(centralApi).not.toHaveBeenCalled();
  });

  it("maps the availability response", async () => {
    centralApi.mockResolvedValueOnce({ slug: "acme", available: true, reason: null });
    expect(await checkSlug("acme")).toBe("available");
    expect(centralApi).toHaveBeenCalledWith("/central/slug-availability?slug=acme");

    centralApi.mockResolvedValueOnce({ slug: "acme", available: false, reason: "taken" });
    expect(await checkSlug("acme")).toBe("taken");
  });

  it("returns error when the API fails", async () => {
    centralApi.mockRejectedValueOnce(new Error("down"));
    expect(await checkSlug("acme")).toBe("error");
  });
});

describe("register", () => {
  const form = () => {
    const fd = new FormData();
    fd.set("name", "Ada");
    fd.set("email", "ada@x.test");
    fd.set("password", "secret123");
    fd.set("password_confirmation", "secret123");
    fd.set("workspace_name", "Acme");
    fd.set("workspace_slug", "acme");
    return fd;
  };

  it("posts the registration and redirects to the tenant callback with the handoff code", async () => {
    centralApi.mockResolvedValue({ workspace: { id: "w", slug: "acme", name: "Acme" }, handoff_code: "a+b/c" });

    await expect(register({}, form())).rejects.toThrow(
      "REDIRECT:http://acme.localhost:3000/auth/callback?code=a%2Bb%2Fc",
    );
    expect(centralApi).toHaveBeenCalledWith("/central/register", {
      method: "POST",
      body: {
        name: "Ada",
        email: "ada@x.test",
        password: "secret123",
        password_confirmation: "secret123",
        workspace_name: "Acme",
        workspace_slug: "acme",
      },
    });
  });

  it("returns field errors on 422", async () => {
    centralApi.mockRejectedValueOnce(
      new ApiError(422, { message: "Invalid.", errors: { workspace_slug: ["Taken."] } }),
    );
    expect(await register({}, form())).toEqual({
      ok: false,
      message: "Invalid.",
      fieldErrors: { workspace_slug: ["Taken."] },
    });
  });
});
