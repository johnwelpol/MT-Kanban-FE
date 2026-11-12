import { beforeEach, describe, expect, it, vi } from "vitest";

const { tenantApi, revalidatePath } = vi.hoisted(() => ({ tenantApi: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), tenantApi }));

const { ApiError } = await import("@/lib/api");
const { createBoard } = await import("./actions");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  tenantApi.mockReset();
  revalidatePath.mockReset();
});

describe("createBoard", () => {
  it("creates the board, revalidates the layout and opens it", async () => {
    tenantApi.mockResolvedValueOnce({ id: "b-1", name: "Roadmap" });
    await expect(createBoard({}, form({ name: "Roadmap", description: "Q3" }))).rejects.toThrow("REDIRECT:/boards/b-1");
    expect(tenantApi).toHaveBeenCalledWith("/boards", {
      method: "POST",
      body: { name: "Roadmap", description: "Q3" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/boards", "layout");
  });

  it("omits an empty description", async () => {
    tenantApi.mockResolvedValueOnce({ id: "b-2" });
    await expect(createBoard({}, form({ name: "X", description: "" }))).rejects.toThrow("REDIRECT:/boards/b-2");
    expect(tenantApi.mock.calls[0][1].body).toEqual({ name: "X" });
  });

  it("returns field errors on 422", async () => {
    tenantApi.mockRejectedValueOnce(new ApiError(422, { message: "Bad.", errors: { name: ["Required."] } }));
    expect(await createBoard({}, form({ name: "" }))).toMatchObject({ fieldErrors: { name: ["Required."] } });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
