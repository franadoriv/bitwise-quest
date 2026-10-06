import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteSlot, getActiveSlot, listLegacySlots, listSlots, readSlot, setActiveSlot, setStorageScope, writeSlot } from "../lib/save/store.ts";
import { readReplica } from "../lib/cloud/storage.ts";
import { newSave } from "../lib/save/schema.ts";

const data = new Map<string, string>();
let full = false;
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { if (full) throw new Error("quota"); data.set(key, value); },
  removeItem: (key: string) => { data.delete(key); },
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });

test("guest and different Google accounts have independent cards and active slots", async () => {
  setStorageScope(null);
  await writeSlot(1, newSave("GUEST")); setActiveSlot(1);
  setStorageScope("alice");
  assert.equal(await readSlot(1), null);
  assert.equal(getActiveSlot(), null);
  await writeSlot(1, newSave("ALICE")); setActiveSlot(1);
  setStorageScope("bob");
  assert.equal(await readSlot(1), null);
  await writeSlot(1, newSave("BOB"));
  setStorageScope(null);
  assert.equal((await readSlot(1))?.player.name, "GUEST");
  assert.equal(getActiveSlot(), 1);
  assert.equal((await readSlot(1, "alice"))?.player.name, "ALICE");
  assert.equal((await readSlot(1, "bob"))?.player.name, "BOB");
});

test("queued saves, deletes and reads cannot reorder async compression", async () => {
  const user = "queued";
  const first = writeSlot(1, newSave("FIRST"), user);
  const last = writeSlot(1, newSave("LAST"), user);
  assert.equal((await readSlot(1, user))?.player.name, "LAST");
  await Promise.all([first, last]);
  const writing = writeSlot(1, newSave("REMOVED"), user);
  const removing = deleteSlot(1, user);
  await Promise.all([writing, removing]);
  assert.equal(await readSlot(1, user), null);
  assert.equal(readReplica(user, 1).dirty, true);
});

test("a cloud download cannot overwrite a local write started during compression", async () => {
  const user = "download-race";
  const pull = writeSlot(1, newSave("REMOTE"), user, true, 0);
  const local = writeSlot(1, newSave("LOCAL"), user);
  assert.equal(await pull, false);
  await local;
  assert.equal((await readSlot(1, user))?.player.name, "LOCAL");
  assert.equal(readReplica(user, 1).dirty, true);
});

test("reducing to three slots preserves previous local saves for export", async () => {
  setStorageScope(null);
  await writeSlot(12, newSave("OLD SLOT"), null);
  assert.equal((await listSlots()).length, 3);
  assert.equal((await listLegacySlots()).find((s) => s.slot === 12)?.save?.player.name, "OLD SLOT");
  setActiveSlot(12);
  assert.equal(getActiveSlot(), 12, "an already active old save remains readable");
});

test("a full browser store cannot make sync read an obsolete save or journal", async () => {
  const user = "quota";
  await writeSlot(1, newSave("OLD"), user);
  full = true;
  try {
    await writeSlot(1, newSave("LATEST"), user);
    assert.equal((await readSlot(1, user))?.player.name, "LATEST");
    assert.equal(readReplica(user, 1).generation, 2);
    await deleteSlot(1, user);
    assert.equal(await readSlot(1, user), null);
  } finally { full = false; }
});
