import type { Board, CardSummary, Column } from "./types";

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const renumber = <T extends { position: number }>(items: T[]): T[] =>
  items.map((item, position) => (item.position === position ? item : { ...item, position }));

export function findColumnOfCard(board: Board, cardId: string): Column | undefined {
  return board.columns.find((column) => column.cards.some((c) => c.id === cardId));
}

export function findCard(board: Board, cardId: string): CardSummary | undefined {
  return findColumnOfCard(board, cardId)?.cards.find((c) => c.id === cardId);
}

export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  const from = findColumnOfCard(board, cardId);
  const to = board.columns.find((c) => c.id === toColumnId);
  if (!from || !to) return board;

  const card = from.cards.find((c) => c.id === cardId)!;
  const target = (to.id === from.id ? from.cards : to.cards).filter((c) => c.id !== cardId);
  target.splice(clamp(toIndex, 0, target.length), 0, { ...card, column_id: toColumnId });

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id === toColumnId) return { ...column, cards: renumber(target) };
      if (column.id === from.id) return { ...column, cards: renumber(column.cards.filter((c) => c.id !== cardId)) };
      return column;
    }),
  };
}

export function moveColumn(board: Board, columnId: string, toIndex: number): Board {
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) return board;
  const columns = board.columns.filter((c) => c.id !== columnId);
  columns.splice(clamp(toIndex, 0, columns.length), 0, column);
  return { ...board, columns: renumber(columns) };
}

export function applyServerOrder(board: Board, columns: { id: string; card_ids: string[] }[]): Board {
  const cards = new Map(board.columns.flatMap((c) => c.cards).map((c) => [c.id, c]));
  const order = new Map(columns.map((c) => [c.id, c.card_ids]));

  return {
    ...board,
    columns: board.columns.map((column) => {
      const ids = order.get(column.id);
      if (!ids) return column;
      const next = ids.flatMap((id) => {
        const card = cards.get(id);
        return card ? [{ ...card, column_id: column.id }] : [];
      });
      return { ...column, cards: renumber(next) };
    }),
  };
}

export function applyColumnOrder(board: Board, columnIds: string[]): Board {
  const byId = new Map(board.columns.map((c) => [c.id, c]));
  const ordered = columnIds.flatMap((id) => byId.get(id) ?? []);
  const rest = board.columns.filter((c) => !columnIds.includes(c.id));
  return { ...board, columns: renumber([...ordered, ...rest]) };
}
