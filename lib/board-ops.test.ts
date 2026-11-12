import { describe, expect, it } from "vitest";
import { applyColumnOrder, applyServerOrder, findCard, findColumnOfCard, moveCard, moveColumn } from "./board-ops";
import type { Board, CardSummary, Column } from "./types";

const card = (id: string, columnId: string, position: number): CardSummary => ({
  id,
  board_id: "b",
  column_id: columnId,
  title: id,
  position,
  assignee: null,
  due_date: null,
  comments_count: 0,
});

const column = (id: string, position: number, cardIds: string[]): Column => ({
  id,
  board_id: "b",
  name: id,
  position,
  cards: cardIds.map((c, i) => card(c, id, i)),
});

const board = (): Board => ({
  id: "b",
  name: "Board",
  description: null,
  created_at: "",
  updated_at: "",
  columns: [column("todo", 0, ["a", "b", "c"]), column("doing", 1, ["d"]), column("done", 2, [])],
});

const ids = (b: Board, columnId: string) => b.columns.find((c) => c.id === columnId)!.cards.map((c) => c.id);
const positions = (b: Board, columnId: string) => b.columns.find((c) => c.id === columnId)!.cards.map((c) => c.position);

describe("find helpers", () => {
  it("finds a card and its column", () => {
    expect(findCard(board(), "d")?.id).toBe("d");
    expect(findColumnOfCard(board(), "d")?.id).toBe("doing");
    expect(findCard(board(), "zz")).toBeUndefined();
    expect(findColumnOfCard(board(), "zz")).toBeUndefined();
  });
});

describe("moveCard", () => {
  it("moves down within a column", () => {
    const b = moveCard(board(), "a", "todo", 2);
    expect(ids(b, "todo")).toEqual(["b", "c", "a"]);
    expect(positions(b, "todo")).toEqual([0, 1, 2]);
  });

  it("moves up within a column", () => {
    expect(ids(moveCard(board(), "c", "todo", 0), "todo")).toEqual(["c", "a", "b"]);
  });

  it("moves across columns to the top, middle and end", () => {
    expect(ids(moveCard(board(), "a", "doing", 0), "doing")).toEqual(["a", "d"]);
    const middle = moveCard(moveCard(board(), "a", "doing", 1), "b", "doing", 1);
    expect(ids(middle, "doing")).toEqual(["d", "b", "a"]);
    const end = moveCard(board(), "b", "done", 0);
    expect(ids(end, "done")).toEqual(["b"]);
    expect(ids(end, "todo")).toEqual(["a", "c"]);
  });

  it("updates column_id and renumbers both columns", () => {
    const b = moveCard(board(), "b", "doing", 0);
    expect(findCard(b, "b")?.column_id).toBe("doing");
    expect(positions(b, "todo")).toEqual([0, 1]);
    expect(positions(b, "doing")).toEqual([0, 1]);
  });

  it("clamps the index", () => {
    expect(ids(moveCard(board(), "a", "doing", 99), "doing")).toEqual(["d", "a"]);
    expect(ids(moveCard(board(), "d", "todo", -5), "todo")).toEqual(["d", "a", "b", "c"]);
  });

  it("leaves untouched columns referentially equal and does not mutate the input", () => {
    const original = board();
    const b = moveCard(original, "a", "doing", 0);
    expect(b.columns[2]).toBe(original.columns[2]);
    expect(ids(original, "todo")).toEqual(["a", "b", "c"]);
  });

  it("returns the board unchanged for unknown cards or columns", () => {
    const b = board();
    expect(moveCard(b, "zz", "todo", 0)).toBe(b);
    expect(moveCard(b, "a", "nope", 0)).toBe(b);
  });
});

describe("moveColumn", () => {
  it("reorders, clamps and renumbers", () => {
    const b = moveColumn(board(), "done", 0);
    expect(b.columns.map((c) => c.id)).toEqual(["done", "todo", "doing"]);
    expect(b.columns.map((c) => c.position)).toEqual([0, 1, 2]);
    expect(moveColumn(board(), "todo", 10).columns.map((c) => c.id)).toEqual(["doing", "done", "todo"]);
  });

  it("returns the board unchanged for an unknown column", () => {
    const b = board();
    expect(moveColumn(b, "nope", 0)).toBe(b);
  });
});

describe("applyServerOrder", () => {
  it("reorders affected columns to match the server", () => {
    const b = applyServerOrder(board(), [
      { id: "todo", card_ids: ["c", "a"] },
      { id: "done", card_ids: ["b"] },
    ]);
    expect(ids(b, "todo")).toEqual(["c", "a"]);
    expect(ids(b, "done")).toEqual(["b"]);
    expect(findCard(b, "b")?.column_id).toBe("done");
    expect(positions(b, "todo")).toEqual([0, 1]);
    expect(ids(b, "doing")).toEqual(["d"]);
  });

  it("skips ids the client does not know", () => {
    expect(ids(applyServerOrder(board(), [{ id: "done", card_ids: ["ghost"] }]), "done")).toEqual([]);
  });
});

describe("applyColumnOrder", () => {
  it("reorders columns to match the server", () => {
    const b = applyColumnOrder(board(), ["doing", "done", "todo"]);
    expect(b.columns.map((c) => c.id)).toEqual(["doing", "done", "todo"]);
    expect(b.columns.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});
