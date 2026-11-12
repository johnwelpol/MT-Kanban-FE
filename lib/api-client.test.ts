import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiFetch } from "./api-client";

const fetchMock = vi.fn();
const assign = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", { location: { assign } });
  fetchMock.mockReset();
  assign.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiFetch", () => {
  it("calls the passthrough with JSON and unwraps data", async () => {
    fetchMock.mockResolvedValueOnce(json(201, { data: { id: "c1" } }));
    await expect(apiFetch("/boards/b/cards", { method: "POST", json: { title: "x" } })).resolves.toEqual({ id: "c1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/boards/b/cards");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"title":"x"}');
    expect(init.headers).toMatchObject({ Accept: "application/json", "Content-Type": "application/json" });
  });

  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiFetch("/boards/b", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws ApiClientError with the body on failure", async () => {
    fetchMock.mockResolvedValueOnce(json(422, { message: "Bad.", errors: { title: ["Required."] } }));
    const err = await apiFetch("/boards/b/cards", { method: "POST", json: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ status: 422, body: { errors: { title: ["Required."] } } });
  });

  it("sends the browser to /logout?expired=1 on 401", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { message: "Unauthenticated." }));
    await expect(apiFetch("/boards")).rejects.toBeInstanceOf(ApiClientError);
    expect(assign).toHaveBeenCalledWith("/logout?expired=1");
  });
});
