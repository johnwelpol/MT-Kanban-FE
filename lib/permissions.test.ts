import { describe, expect, it } from "vitest";
import { assignableRoles, can, canManage, rank, ROLE_PERMISSIONS } from "./permissions";
import type { Me, Permission, Role } from "./types";

const ALL: Permission[] = [
  "workspace.update", "members.view", "members.manage", "invitations.manage",
  "board.view", "board.create", "board.update", "board.delete",
  "column.manage", "card.manage", "comment.create", "comment.moderate",
];

const EXPECTED: Record<Role, Permission[]> = {
  owner: ALL,
  admin: ALL,
  member: ["members.view", "board.view", "board.create", "board.update",
           "column.manage", "card.manage", "comment.create"],
  viewer: ["members.view", "board.view"],
};

const me = (role: Role, permissions: Permission[] = []): Me => ({
  user: { id: 1, name: "A", email: "a@x.test" },
  workspace: { id: "w", slug: "acme", name: "Acme" },
  role,
  permissions,
});

describe("ROLE_PERMISSIONS", () => {
  it.each(Object.entries(EXPECTED))("%s matches the §5 matrix", (role, perms) => {
    expect([...ROLE_PERMISSIONS[role as Role]].sort()).toEqual([...perms].sort());
  });
});

describe("rank", () => {
  it("orders owner > admin > member > viewer", () => {
    expect([rank("owner"), rank("admin"), rank("member"), rank("viewer")]).toEqual([4, 3, 2, 1]);
  });
});

describe("can", () => {
  it("uses the permissions Laravel returned in /me", () => {
    expect(can(me("viewer", ["board.view"]), "board.view")).toBe(true);
    expect(can(me("viewer", ["board.view"]), "card.manage")).toBe(false);
    expect(can(null, "board.view")).toBe(false);
  });
});

describe("canManage", () => {
  it.each<[Role, Role, boolean]>([
    ["owner", "admin", true],
    ["owner", "member", true],
    ["owner", "viewer", true],
    ["owner", "owner", false],
    ["admin", "member", true],
    ["admin", "viewer", true],
    ["admin", "admin", false],
    ["admin", "owner", false],
    ["member", "viewer", false],
    ["viewer", "viewer", false],
  ])("%s → %s = %s", (actor, target, expected) => {
    expect(canManage(actor, target)).toBe(expected);
  });
});

describe("assignableRoles", () => {
  it.each<[Role, Role[]]>([
    ["owner", ["admin", "member", "viewer"]],
    ["admin", ["member", "viewer"]],
    ["member", []],
    ["viewer", []],
  ])("%s → %o", (actor, expected) => {
    expect(assignableRoles(actor)).toEqual(expected);
  });
});
