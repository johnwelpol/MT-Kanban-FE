import { beforeEach, describe, expect, it, vi } from "vitest";

const { tenantApi, revalidatePath } = vi.hoisted(() => ({ tenantApi: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), tenantApi }));

const { ApiError } = await import("@/lib/api");
const { invite, removeMember, revokeInvitation, updateRole } = await import("./members/actions");
const { renameWorkspace } = await import("./workspace/actions");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  tenantApi.mockReset();
  revalidatePath.mockReset();
});

describe("members actions", () => {
  it("updateRole patches the member and revalidates", async () => {
    tenantApi.mockResolvedValueOnce({});
    expect(await updateRole(7, "viewer")).toEqual({ ok: true, message: "Role updated." });
    expect(tenantApi).toHaveBeenCalledWith("/members/7", { method: "PATCH", body: { role: "viewer" } });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/members");
  });

  it("updateRole surfaces Laravel's refusal", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(403, { message: "You cannot change this member." }));
    expect(await updateRole(1, "admin")).toEqual({ ok: false, message: "You cannot change this member." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("removeMember deletes and revalidates", async () => {
    tenantApi.mockResolvedValueOnce(undefined);
    expect(await removeMember(7)).toEqual({ ok: true, message: "Member removed." });
    expect(tenantApi).toHaveBeenCalledWith("/members/7", { method: "DELETE" });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/members");
  });

  it("invite posts email and role", async () => {
    tenantApi.mockResolvedValueOnce({ id: "i-1" });
    expect(await invite({}, form({ email: "bo@x.test", role: "member" }))).toEqual({
      ok: true,
      message: "Invitation sent to bo@x.test.",
    });
    expect(tenantApi).toHaveBeenCalledWith("/invitations", {
      method: "POST",
      body: { email: "bo@x.test", role: "member" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/members");
  });

  it("invite returns field errors on 422", async () => {
    tenantApi.mockRejectedValueOnce(
      new ApiError(422, { message: "Bad.", errors: { email: ["Already a member."] } }),
    );
    expect(await invite({}, form({ email: "a@x.test", role: "member" }))).toMatchObject({
      fieldErrors: { email: ["Already a member."] },
    });
  });

  it("revokeInvitation deletes and revalidates", async () => {
    tenantApi.mockResolvedValueOnce(undefined);
    expect(await revokeInvitation("i/1")).toEqual({ ok: true, message: "Invitation revoked." });
    expect(tenantApi).toHaveBeenCalledWith("/invitations/i%2F1", { method: "DELETE" });
  });
});

describe("renameWorkspace", () => {
  it("patches the workspace and revalidates the whole layout", async () => {
    tenantApi.mockResolvedValueOnce({ id: "t", slug: "acme", name: "Acme Co" });
    expect(await renameWorkspace({}, form({ name: "Acme Co" }))).toEqual({ ok: true, message: "Workspace renamed." });
    expect(tenantApi).toHaveBeenCalledWith("/workspace", { method: "PATCH", body: { name: "Acme Co" } });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns field errors on 422", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "Bad.", errors: { name: ["Too short."] } }));
    expect(await renameWorkspace({}, form({ name: "A" }))).toMatchObject({ fieldErrors: { name: ["Too short."] } });
  });
});
