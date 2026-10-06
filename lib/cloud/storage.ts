// Small account-scoped journal: a failed upload survives reloads and remains retryable.
import type { Replica } from "./model.ts";

const memory = new Map<string, string>();
export function readSetting(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try { return localStorage.getItem(key); } catch { return memory.get(key) ?? null; }
}
export function writeSetting(key: string, value: string) {
  try { localStorage.setItem(key, value); memory.delete(key); } catch { memory.set(key, value); }
}
const key = (user: string, slot: number) => `bwq:cloud:${user}:journal:${slot}`;
export function readReplica(user: string, slot: number): Replica {
  try {
    const r = JSON.parse(readSetting(key(user, slot)) ?? "null");
    if (r && Number.isSafeInteger(r.revision) && r.revision >= 0 && Number.isSafeInteger(r.generation) && r.generation >= 0) {
      return { revision: r.revision, generation: r.generation, dirty: r.dirty === true };
    }
  } catch {}
  return { revision: 0, generation: 0, dirty: false };
}
export function writeReplica(user: string, slot: number, replica: Replica) {
  writeSetting(key(user, slot), JSON.stringify(replica));
}
export function markDirty(user: string, slot: number) {
  const r = readReplica(user, slot);
  writeReplica(user, slot, { ...r, dirty: true, generation: r.generation + 1 });
}
