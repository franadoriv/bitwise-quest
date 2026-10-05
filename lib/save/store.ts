"use client";
// The memory card: SLOT_COUNT save slots in localStorage, each holding the binary save as base64.
// Falls back to memory when storage is unavailable (private mode, blocked site data).
import { decodeSave, encodeSave, exportFileName, fromBase64, toBase64 } from "./codec";
import { SaveError } from "./migrate";
import { SLOT_COUNT, type SaveData } from "./schema";

const slotKey = (i: number) => `bwq:slot:${i}`;
const ACTIVE = "bwq:active";
const memory = new Map<string, string>();

function get(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return memory.get(k) ?? null; }
}
function set(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { memory.set(k, v); }
}
function del(k: string) {
  try { localStorage.removeItem(k); } catch { memory.delete(k); }
}

export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1);

export type SlotEntry = { slot: number; save: SaveData } | { slot: number; save: null; error?: SaveError["code"] };

export async function readSlot(slot: number): Promise<SaveData | null> {
  const raw = get(slotKey(slot));
  if (!raw) return null;
  return decodeSave(fromBase64(raw));
}

export async function listSlots(): Promise<SlotEntry[]> {
  return Promise.all(
    SLOTS.map(async (slot) => {
      try {
        return { slot, save: await readSlot(slot) };
      } catch (e) {
        return { slot, save: null, error: e instanceof SaveError ? e.code : "corrupt" };
      }
    }),
  );
}

export async function writeSlot(slot: number, save: SaveData) {
  set(slotKey(slot), toBase64(await encodeSave(save)));
  window.dispatchEvent(new CustomEvent("bwq:slots"));
}

export function deleteSlot(slot: number) {
  del(slotKey(slot));
  if (getActiveSlot() === slot) setActiveSlot(null);
  window.dispatchEvent(new CustomEvent("bwq:slots"));
}

export function getActiveSlot(): number | null {
  const v = Number(get(ACTIVE));
  return Number.isInteger(v) && v >= 1 && v <= SLOT_COUNT ? v : null;
}

export function setActiveSlot(slot: number | null) {
  if (slot == null) del(ACTIVE);
  else set(ACTIVE, String(slot));
}

/** Downloads the slot as a .bwq file. */
export async function exportSlot(slot: number) {
  const save = await readSlot(slot);
  if (!save) return;
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
  if (file.size > 2_000_000) throw new SaveError("format", "File is too large to be a save");
  return decodeSave(new Uint8Array(await file.arrayBuffer()));
}
