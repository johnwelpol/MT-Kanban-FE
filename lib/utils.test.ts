import { describe, expect, it } from "vitest";
import { initials } from "./utils";

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["ada", "A"],
    ["  Grace   Brewster Hopper ", "GH"],
    ["émile zola", "ÉZ"],
    ["", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
