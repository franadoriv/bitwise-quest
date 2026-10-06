"use client";
// The memory card: SLOT_COUNT save slots in localStorage, each holding the binary save as base64.
// Falls back to memory when storage is unavailable (private mode, blocked site data).
import { decodeSave, encodeSave, exportFileName, fromBase64, toBase64 } from "./codec.ts";
import { SaveError } from "./migrate.ts";
import { LEGACY_SLOT_COUNT, SLOT_COUNT, type SaveData } from "./schema.ts";
import { MAX_SAVE_BYTES } from "./validate.ts";
import { markDirty, readReplica } from "../cloud/storage.ts";

let scope: string | null = null;
const prefix = (user: string | null) => user ? `bwq:cloud:${user}:` : "bwq:";
const slotKey = (i: number, user = scope) => `${prefix(user)}slot:${i}`;
const activeKey = () => `${prefix(scope)}active`;
const memory = new Map<string, string>();
const pending = new Map<string, Promise<boolean>>();

export function getStorageScope() { return scope; }
export function setStorageScope(user: string | null) {
  if (scope === user) return;
  scope = user;
  window.dispatchEvent(new CustomEvent("bwq:scope"));
  window.dispatchEvent(new CustomEvent("bwq:slots"));
}

function get(k: string): string | null {
  if (memory.has(k)) return memory.get(k)!;
  try { return localStorage.getItem(k); } catch { return memory.get(k) ?? null; }
}
function set(k: string, v: string) {
  try { localStorage.setItem(k, v); memory.delete(k); } catch { memory.set(k, v); }
}
function del(k: string) {
  try { localStorage.removeItem(k); } catch {}
  memory.delete(k);
}

export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1);

export type SlotEntry = { slot: number; save: SaveData } | { slot: number; save: null; error?: SaveError["code"] };

export async function readSlot(slot: number, user = scope): Promise<SaveData | null> {
  await pending.get(slotKey(slot, user));
  const raw = get(slotKey(slot, user));
  if (!raw) return null;
  return decodeSave(fromBase64(raw));
}

export async function listSlots(user = scope): Promise<SlotEntry[]> {
  return listRange(SLOTS, user);
}

/** Previous slots remain recoverable, but are not destinations for new games or imports. */
export async function listLegacySlots(): Promise<SlotEntry[]> {
  const old = await listRange(Array.from({ length: LEGACY_SLOT_COUNT - SLOT_COUNT }, (_, i) => i + SLOT_COUNT + 1), null);
  return old.filter((entry) => entry.save || entry.error);
}

async function listRange(slots: number[], user: string | null): Promise<SlotEntry[]> {
  return Promise.all(
    slots.map(async (slot) => {
      try {
        return { slot, save: await readSlot(slot, user) };
      } catch (e) {
        return { slot, save: null, error: e instanceof SaveError ? e.code : "corrupt" };
      }
    }),
  );
}

export async function writeSlot(slot: number, save: SaveData, user = scope, remote = false, expectedGeneration?: number): Promise<boolean> {
  const key = slotKey(slot, user);
  const previous = pending.get(key);
  const snapshot = structuredClone(save);
  if (user && !remote) markDirty(user, slot);
  const job = (async () => {
    await previous;
    const encoded = toBase64(await encodeSave(snapshot));
    if (remote && user && expectedGeneration !== undefined && readReplica(user, slot).generation !== expectedGeneration) return false;
    set(key, encoded);
    if (user === scope) {
      window.dispatchEvent(new CustomEvent("bwq:slots"));
      if (!remote) window.dispatchEvent(new CustomEvent("bwq:save-change", { detail: { user, slot } }));
    }
    return true;
  })();
  pending.set(key, job);
  try { return await job; } finally { if (pending.get(key) === job) pending.delete(key); }
}

export async function deleteSlot(slot: number, user = scope, remote = false, expectedGeneration?: number): Promise<boolean> {
  const key = slotKey(slot, user);
  const previous = pending.get(key);
  if (user && !remote) markDirty(user, slot);
  const job = (async () => {
    await previous;
    if (remote && user && expectedGeneration !== undefined && readReplica(user, slot).generation !== expectedGeneration) return false;
    del(key);
    if (user === scope) {
      if (getActiveSlot() === slot) setActiveSlot(null);
      window.dispatchEvent(new CustomEvent("bwq:slots"));
      if (!remote) window.dispatchEvent(new CustomEvent("bwq:save-change", { detail: { user, slot } }));
    }
    return true;
  })();
  pending.set(key, job);
  try { return await job; } finally { if (pending.get(key) === job) pending.delete(key); }
}

export function getActiveSlot(): number | null {
  const v = Number(get(activeKey()));
  return Number.isInteger(v) && v >= 1 && v <= (scope ? SLOT_COUNT : LEGACY_SLOT_COUNT) ? v : null;
}

export function setActiveSlot(slot: number | null) {
  if (slot == null) del(activeKey());
  else set(activeKey(), String(slot));
}

/** Downloads the slot as a .bwq file. */
export async function exportSlot(slot: number) {
  const save = await readSlot(slot);
  if (!save) return;
  await downloadSave(save);
}

/** Also used to back up either version of a cloud conflict. */
export async function downloadSave(save: SaveData) {
  const bytes = await encodeSave(save);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/octet-stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName(save);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads and validates a .bwq file. Throws SaveError. */
export async function readSaveFile(file: File): Promise<SaveData> {
  if (file.size > MAX_SAVE_BYTES) throw new SaveError("format", "File is too large to be a save");
  return decodeSave(new Uint8Array(await file.arrayBuffer()));
}
