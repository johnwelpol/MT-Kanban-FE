import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const valid = {
  ROOT_DOMAIN: "localhost",
  APP_PROTOCOL: "http",
  APP_PORT: "3000",
  INTERNAL_API_URL: "http://127.0.0.1:8000",
  INTERNAL_API_KEY: "k".repeat(64),
  SESSION_SECRET: "s".repeat(32),
};

describe("parseEnv", () => {
  it("parses a valid env", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("treats an empty APP_PORT as absent", () => {
    expect(parseEnv({ ...valid, APP_PORT: "" }).APP_PORT).toBeUndefined();
  });

  it("throws when a required key is missing", () => {
    expect(() => parseEnv({ ...valid, INTERNAL_API_KEY: undefined })).toThrow(
      /INTERNAL_API_KEY/,
    );
  });

  it("throws when SESSION_SECRET is shorter than 32 chars", () => {
    expect(() => parseEnv({ ...valid, SESSION_SECRET: "short" })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it("rejects an invalid INTERNAL_API_URL", () => {
    expect(() =>
      parseEnv({ ...valid, INTERNAL_API_URL: "not a url" }),
    ).toThrow(/INTERNAL_API_URL/);
  });
});
