import { afterEach, describe, expect, it, vi } from "vitest";
import { rootUrl, safeNext, tenantUrl } from "./urls";

afterEach(() => vi.unstubAllEnvs());

describe("rootUrl / tenantUrl", () => {
  it("includes the port when APP_PORT is set", () => {
    expect(rootUrl("/login")).toBe("http://localhost:3000/login");
    expect(tenantUrl("acme", "/boards")).toBe("http://acme.localhost:3000/boards");
  });

  it("omits the port when APP_PORT is empty", () => {
    vi.stubEnv("APP_PORT", "");
    vi.stubEnv("APP_PROTOCOL", "https");
    vi.stubEnv("ROOT_DOMAIN", "yourapp.com");
    expect(rootUrl("/register")).toBe("https://yourapp.com/register");
    expect(tenantUrl("acme", "/auth/callback?code=x")).toBe("https://acme.yourapp.com/auth/callback?code=x");
  });
});

describe("safeNext", () => {
  it.each([
    ["/boards/123", "/boards/123"],
    ["/settings/members?x=1", "/settings/members?x=1"],
    ["//evil.com", "/boards"],
    ["/\\evil.com", "/boards"],
    ["https://evil.com", "/boards"],
    ["boards", "/boards"],
    ["", "/boards"],
    [null, "/boards"],
    [undefined, "/boards"],
  ])("%s → %s", (value, expected) => {
    expect(safeNext(value)).toBe(expected);
  });
});
