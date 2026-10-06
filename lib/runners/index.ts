import "server-only";
import type { LanguageRunner } from "./types";
import { rustPlayground } from "./rust-playground";
import { goPlayground } from "./go-playground";
import { godboltCpp, godboltCsharp } from "./godbolt";

const RUNNERS: Record<string, LanguageRunner> = Object.fromEntries(
  [rustPlayground, goPlayground, godboltCpp, godboltCsharp].map((r) => [r.id, r]),
);

export function getRunner(id: string | null | undefined): LanguageRunner | null {
  if (process.env.BITWISE_RUNNER === "off" || !id) return null;
  return RUNNERS[id] ?? null;
}
