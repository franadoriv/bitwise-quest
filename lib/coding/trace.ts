// Trace tables: pure helpers shared by the game (judging the player's cells) and the validator
// (the line a `verify` program prints for each row).
import type { TraceRow } from "../content/types.ts";

/** Separator between cells in the output of a trace `verify` program. */
export const TRACE_SEP = " | ";

/** How a cell is compared: trimmed, inner whitespace collapsed (paper answers are written loosely). */
export const normCell = (v: string) => v.trim().replace(/\s+/g, " ");

/** The stdout a correct `verify` program prints: one line per row. */
export const traceStdout = (rows: TraceRow[]) => rows.map((r) => r.cells.join(TRACE_SEP)).join("\n");

/** Cells the player must fill (not given): [row, column] pairs. */
export const blankCells = (rows: TraceRow[]) =>
  rows.flatMap((r, ri) => r.cells.map((_, ci) => [ri, ci] as const).filter(([, ci]) => !r.given?.includes(ci)));

/**
 * Judges the player's answers (answers[row][col]; given cells are ignored). Each cell is judged on
 * its own against the true state, so one slip never cascades into the following rows.
 */
export function judgeTrace(rows: TraceRow[], answers: string[][]) {
  const cells = rows.map((r, ri) => r.cells.map((v, ci) => r.given?.includes(ci) || normCell(answers[ri]?.[ci] ?? "") === normCell(v)));
  const blanks = blankCells(rows);
  const right = blanks.filter(([ri, ci]) => cells[ri][ci]).length;
  return { cells, right, total: blanks.length, all: right === blanks.length };
}
