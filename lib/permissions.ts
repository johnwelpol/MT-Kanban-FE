import type { Me, Permission, Role } from "./types";

const MEMBER: Permission[] = [
  "members.view", "board.view", "board.create", "board.update",
  "column.manage", "card.manage", "comment.create",
];
const ADMIN: Permission[] = [
  ...MEMBER, "workspace.update", "members.manage", "invitations.manage",
  "board.delete", "comment.moderate",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ADMIN,
  admin: ADMIN,
  member: MEMBER,
  viewer: ["members.view", "board.view"],
};

const RANKS: Record<Role, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

export function rank(role: Role): number {
  return RANKS[role];
}

export function can(me: Pick<Me, "permissions"> | null | undefined, permission: Permission): boolean {
  return !!me?.permissions.includes(permission);
}

export function canManage(actor: Role, target: Role): boolean {
  return ROLE_PERMISSIONS[actor].includes("members.manage") && rank(target) < rank(actor);
}

export function assignableRoles(actor: Role): Role[] {
  if (!ROLE_PERMISSIONS[actor].includes("invitations.manage")) return [];
  return (["admin", "member", "viewer"] as const).filter((r) => rank(r) < rank(actor));
}
