export const qk = {
  board: (id: string) => ["board", id] as const,
  card: (id: string) => ["card", id] as const,
  members: () => ["members"] as const,
};
