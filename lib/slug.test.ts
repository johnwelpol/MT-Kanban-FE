import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, slugify, validateSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Acme Café & Co.", "acme-cafe-co"],
    ["  Hello   World  ", "hello-world"],
    ["--Já--Ñandú--", "ja-nandu"],
    ["Team_42!!", "team-42"],
    ["日本語", ""],
    ["", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps the slug at 40 chars without a trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(39)} b c`);
    expect(slug).toBe("a".repeat(39));
    expect(slugify("x".repeat(60))).toHaveLength(40);
  });
});

describe("validateSlug", () => {
  it.each(["acme", "a1b", "my-team-2", "a".repeat(40), "a-b"])("accepts %s", (slug) => {
    expect(validateSlug(slug)).toBeNull();
  });

  it.each([
    "ab",
    "a".repeat(41),
    "-acme",
    "acme-",
    "Acme",
    "ac me",
    "acme_co",
    "café",
    "",
  ])("rejects %s as invalid", (slug) => {
    expect(validateSlug(slug)).toBe("invalid");
  });

  it.each([...RESERVED_SLUGS])("rejects %s as reserved", (slug) => {
    expect(validateSlug(slug)).toBe("reserved");
  });
});
