import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { ApiError } = await import("./laravel");
const { toFormState } = await import("./form");

describe("toFormState", () => {
  it("maps 422 to field errors", () => {
    const e = new ApiError(422, { message: "Invalid.", errors: { email: ["Taken."] } });
    expect(toFormState(e)).toEqual({ ok: false, message: "Invalid.", fieldErrors: { email: ["Taken."] } });
  });

  it("maps 429 to a message", () => {
    expect(toFormState(new ApiError(429, null))).toEqual({
      ok: false,
      message: "Too many attempts. Please try again later.",
    });
  });

  it("rethrows other API errors", () => {
    const e = new ApiError(500, null);
    expect(() => toFormState(e)).toThrow(e);
  });

  it("rethrows non-API errors such as Next redirects", () => {
    const e = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" });
    expect(() => toFormState(e)).toThrow(e);
  });
});
