import { test } from "node:test";
import assert from "node:assert/strict";
import { callbackDestination, cloudRow, fingerprint, reconcile, type CloudRow, type Replica } from "../lib/cloud/model.ts";
import { CardSync, type CloudTransport, type LocalCard } from "../lib/cloud/sync.ts";
import { newSave, type SaveData } from "../lib/save/schema.ts";

function fixture() {
  const saves = new Map<number, SaveData | null>();
  const journal = new Map<number, Replica>();
  const rows = new Map<number, CloudRow>();
  const writes: number[] = [];
  const local: LocalCard = {
    read: async (slot) => structuredClone(saves.get(slot) ?? null),
    apply: async (slot, data, generation) => {
      if (local.replica(slot).generation !== generation) return false;
      saves.set(slot, structuredClone(data)); return true;
    },
    replica: (slot) => ({ ...(journal.get(slot) ?? { revision: 0, dirty: false, generation: 0 }) }),
    journal: (slot, replica) => { journal.set(slot, replica); },
  };
  const remote: CloudTransport = {
    list: async () => structuredClone([...rows.values()]),
    write: async (slot, revision, data) => {
      writes.push(slot);
      if ((rows.get(slot)?.revision ?? 0) !== revision) return null;
      const row = { slot, revision: revision + 1, data: structuredClone(data) };
      rows.set(slot, row);
      return row;
    },
  };
  const edit = (slot: number, data: SaveData | null) => {
    saves.set(slot, data);
    const r = local.replica(slot);
    journal.set(slot, { ...r, dirty: true, generation: r.generation + 1 });
  };
  return { saves, journal, rows, writes, local, remote, edit, engine: new CardSync(local, remote) };
}

test("a new device downloads cloud slots without rewriting them", async () => {
  const f = fixture();
  const data = newSave("Ada");
  f.rows.set(3, { slot: 3, revision: 7, data });
  await f.engine.run();
  assert.deepEqual(f.saves.get(3), data);
  assert.equal(f.journal.get(3)?.revision, 7);
  assert.deepEqual(f.writes, []);
});

test("offline changes survive a failed sync and upload on retry", async () => {
  const f = fixture();
  f.edit(1, newSave("Ada"));
  const list = f.remote.list;
  f.remote.list = async () => { throw new Error("offline"); };
  await assert.rejects(f.engine.run());
  assert.equal(f.local.replica(1).dirty, true);
  f.remote.list = list;
  await f.engine.run();
  assert.equal(f.rows.get(1)?.data?.player.name, "Ada");
  assert.equal(f.local.replica(1).dirty, false);
});

test("concurrent device edits conflict rather than overwrite, regardless of clocks", async () => {
  const f = fixture();
  f.journal.set(1, { revision: 2, dirty: false, generation: 0 });
  const local = newSave("LOCAL", 999999);
  const remote = newSave("REMOTE", 1);
  f.edit(1, local);
  f.rows.set(1, { slot: 1, revision: 3, data: remote });
  const conflicts = await f.engine.run();
  assert.equal(conflicts.length, 1);
  assert.deepEqual(f.saves.get(1), local);
  assert.deepEqual(f.rows.get(1)?.data, remote);
  assert.deepEqual(f.writes, []);
  await f.engine.resolve(1, "local");
  await f.engine.run(false);
  assert.equal(f.rows.get(1)?.revision, 4);
  assert.deepEqual(f.rows.get(1)?.data, local);
});

test("delete tombstones reach another device and cannot silently erase offline progress", async () => {
  const f = fixture();
  f.saves.set(1, newSave("Ada"));
  f.journal.set(1, { revision: 2, dirty: false, generation: 0 });
  f.rows.set(1, { slot: 1, revision: 3, data: null });
  await f.engine.run();
  assert.equal(f.saves.get(1), null);
  f.edit(1, newSave("OFFLINE"));
  f.rows.set(1, { slot: 1, revision: 4, data: null });
  assert.equal((await f.engine.run()).length, 1);
});

test("an edit made during an upload stays dirty and is sent in the next flush", async () => {
  const f = fixture();
  f.edit(1, newSave("BEFORE"));
  const write = f.remote.write;
  f.remote.write = async (...args) => {
    const result = await write(...args);
    f.edit(1, newSave("AFTER"));
    return result;
  };
  await f.engine.run();
  assert.equal(f.rows.get(1)?.data?.player.name, "BEFORE");
  assert.equal(f.local.replica(1).dirty, true);
  assert.equal(f.local.replica(1).revision, 1);
  f.remote.write = write;
  await f.engine.run(false);
  assert.equal(f.rows.get(1)?.data?.player.name, "AFTER");
  assert.equal(f.local.replica(1).dirty, false);
});

test("a remote change during an upload is detected by compare-and-swap", async () => {
  const f = fixture();
  f.edit(1, newSave("LOCAL"));
  const write = f.remote.write;
  f.remote.write = async (...args) => {
    f.rows.set(1, { slot: 1, revision: 1, data: newSave("OTHER") });
    return write(...args);
  };
  assert.equal((await f.engine.run()).length, 1);
  assert.equal(f.rows.get(1)?.data?.player.name, "OTHER");
});

test("stopping an account sync prevents late responses from modifying its cache", async () => {
  const f = fixture();
  f.remote.list = async () => { f.engine.stop(); return [{ slot: 1, revision: 1, data: newSave("OTHER") }]; };
  await f.engine.run();
  assert.equal(f.saves.size, 0);
  assert.equal(f.journal.size, 0);
});

test("a delayed list cannot roll back a revision already advanced by another tab", async () => {
  const f = fixture();
  const data = newSave("LATEST");
  f.saves.set(1, data);
  f.journal.set(1, { revision: 3, generation: 2, dirty: false });
  f.rows.set(1, { slot: 1, revision: 2, data: newSave("STALE") });
  await f.engine.run();
  assert.deepEqual(f.saves.get(1), data);
  assert.equal(f.local.replica(1).revision, 3);
});

test("a local edit while applying a download is preserved for reconciliation", async () => {
  const f = fixture();
  f.rows.set(1, { slot: 1, revision: 1, data: newSave("REMOTE") });
  const apply = f.local.apply;
  f.local.apply = async (...args) => { f.edit(1, newSave("NEW LOCAL")); return apply(...args); };
  await f.engine.run();
  assert.equal(f.saves.get(1)?.player.name, "NEW LOCAL");
  assert.equal(f.local.replica(1).dirty, true);
  assert.equal(f.local.replica(1).revision, 0);
  assert.equal((await f.engine.run()).length, 1);
});

test("JSONB key order and randomized binary exports do not cause false conflicts", () => {
  assert.equal(fingerprint({ b: [1, 2], a: { y: 3, x: 4 } }), fingerprint({ a: { x: 4, y: 3 }, b: [1, 2] }));
  const data = newSave("Ada");
  assert.equal(reconcile(data, { revision: 1, generation: 3, dirty: true }, { slot: 1, revision: 9, data }), "same");
});

test("cloud input refuses newer/corrupt saves, invalid slots and oversized payloads", () => {
  for (const slot of [0, 4, 16, 1.5]) assert.throws(() => cloudRow({ slot, revision: 1, data: newSave("Ada") }));
  assert.throws(() => cloudRow({ slot: 1, revision: 1, data: { version: 999 } }));
  assert.throws(() => cloudRow({ slot: 1, revision: 1, data: { nope: true } }));
  assert.throws(() => cloudRow({ slot: 1, revision: 1, data: { ...newSave("Ada"), padding: "x".repeat(262144) } }));
});

test("OAuth destinations cannot accept arbitrary origins", () => {
  assert.equal(callbackDestination("https://evil.example"), "/saves");
  assert.equal(callbackDestination("//evil.example"), "/saves");
  assert.equal(callbackDestination("/play/\\evil"), "/saves");
  assert.equal(callbackDestination("/play/rust"), "/saves?next=%2Fplay%2Frust");
});
