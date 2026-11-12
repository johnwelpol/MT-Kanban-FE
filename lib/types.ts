export type Role = "owner" | "admin" | "member" | "viewer";
export type Permission =
  | "workspace.update" | "members.view" | "members.manage" | "invitations.manage"
  | "board.view" | "board.create" | "board.update" | "board.delete"
  | "column.manage" | "card.manage" | "comment.create" | "comment.moderate";

export type User = { id: number; name: string; email: string };
export type Workspace = { id: string; slug: string; name: string };
export type Me = { user: User; workspace: Workspace; role: Role; permissions: Permission[] };
export type AuthResult = { token: string; user: User };
export type Member = { user: User; role: Role; joined_at: string };

export type BoardSummary = { id: string; name: string; description: string | null;
                             cards_count: number; created_at: string; updated_at: string };
export type Board = Omit<BoardSummary, "cards_count"> & { columns: Column[] };
export type Column = { id: string; board_id: string; name: string; position: number; cards: CardSummary[] };
export type CardSummary = { id: string; board_id: string; column_id: string; title: string; position: number;
                            assignee: User | null; due_date: string | null; comments_count: number };
export type Card = CardSummary & { description: string | null; created_by: User | null;
                                   created_at: string; updated_at: string; comments: Comment[] };
export type Comment = { id: string; card_id: string; body: string; author: User; created_at: string };

export type Invitation = { id: string; email: string; role: Role; invited_by: User; expires_at: string; created_at: string };
export type InvitePreview = { email: string; role: Role; workspace: { name: string; slug: string };
                              inviter_name: string; user_exists: boolean };

export type BoardUpdatedEvent = {
  board_id: string;
  type: "board.updated" | "board.deleted"
      | "column.created" | "column.updated" | "column.moved" | "column.deleted"
      | "card.created" | "card.updated" | "card.moved" | "card.deleted"
      | "comment.created" | "comment.deleted";
  actor_id: number | null;
  card_id?: string;
  column_id?: string;
};
