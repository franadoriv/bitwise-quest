// Cloud transport metadata is separate from SaveData: exports and save migrations stay unchanged.
import { migrate } from "../save/migrate.ts";
import { SLOT_COUNT, type SaveData } from "../save/schema.ts";
import { validateSaveInput } from "../save/validate.ts";

export const MAX_CLOUD_BYTES = 262_144;
export interface CloudRow { slot: number; revision: number; data: SaveData | null }
export interface Replica { revision: number; dirty: boolean; generation: number }
export interface Conflict { slot: number; local: SaveData | null; remote: CloudRow }

/** JSONB reorders object keys; compare content, never the randomized .bwq bytes or client clocks. */
export function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((k) => `${JSON.stringify(k)}:${fingerprint(record[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function cloudRow(raw: unknown): CloudRow {
  if (!raw || typeof raw !== "object") throw new Error("invalid_cloud_save");
  const r = raw as Record<string, unknown>;
  if (!Number.isInteger(r.slot) || Number(r.slot) < 1 || Number(r.slot) > SLOT_COUNT ||
      !Number.isSafeInteger(r.revision) || Number(r.revision) < 1 || !Object.hasOwn(r, "data")) throw new Error("invalid_cloud_save");
  if (new TextEncoder().encode(JSON.stringify(r.data)).length > MAX_CLOUD_BYTES) throw new Error("cloud_save_too_large");
  if (r.data !== null) validateSaveInput(r.data);
  return { slot: Number(r.slot), revision: Number(r.revision), data: r.data === null ? null : migrate(r.data) };
}

export type Reconcile = "same" | "pull" | "push" | "conflict";
export function reconcile(local: SaveData | null, replica: Replica, remote: CloudRow): Reconcile {
  if (fingerprint(local) === fingerprint(remote.data)) return "same";
  if (!replica.dirty) return "pull";
  return replica.revision === remote.revision ? "push" : "conflict";
}

/** OAuth callbacks always return to our card, never to an arbitrary URL in a query string. */
export function callbackDestination(next: string | null): string {
  return next?.startsWith("/play/") && !/[\\\u0000-\u001f]/.test(next)
    ? `/saves?next=${encodeURIComponent(next)}` : "/saves";
}

export function supabaseOrigin(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.username && !url.password && !url.port
      ? url.origin : null;
  } catch { return null; }
}
