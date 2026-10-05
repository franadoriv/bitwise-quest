import "server-only";
import type { LanguageRunner } from "./types";
import { rustPlayground } from "./rust-playground";

const RUNNERS: Record<string, LanguageRunner> = {
  [rustPlayground.id]: rustPlayground,
};

export function getRunner(id: string | null | undefined): LanguageRunner | null {
  if (process.env.BITFORGE_RUNNER === "off" || !id) return null;
  return RUNNERS[id] ?? null;
}
