// Execute the actual migration against ephemeral PostgreSQL, including roles, RLS and RPCs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { newSave } from "../lib/save/schema.ts";

test("cloud SQL enforces account isolation, atomic revisions, tombstones, bounds and auth", async () => {
  const db = new PGlite();
  const alice = "00000000-0000-4000-8000-000000000001";
  const bob = "00000000-0000-4000-8000-000000000002";
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      insert into auth.users values ('${alice}'), ('${bob}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);
    const sql = await readFile(new URL("../supabase/migrations/202610060001_cloud_saves.sql", import.meta.url), "utf8");
    await db.exec(sql);
    await db.exec(sql); // Setup is safely repeatable.
    const login = async (user: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
      await db.exec("set role authenticated");
    };
    const save = newSave("ALICE");
    const write = (slot: number, rev: number, data: unknown) => db.query<{ revision: number; data: unknown }>(
      "select * from public.sync_cloud_save($1, $2, $3::jsonb)", [slot, rev, data === null ? null : JSON.stringify(data)]);
    await login(alice);
    assert.equal((await write(1, 0, save)).rows.length, 1);
    assert.equal((await write(1, 0, newSave("REPLACEMENT"))).rows.length, 0, "a stale initial sync cannot overwrite");
    assert.equal((await db.query("select * from public.cloud_saves")).rows.length, 1);
    await assert.rejects(db.query("update public.cloud_saves set data = null"), /permission denied/);
    await assert.rejects(db.query("delete from public.cloud_saves"), /permission denied/);
    await assert.rejects(write(1, 1, save), /save_cooldown/);
    await login(bob);
    assert.equal((await db.query("select * from public.cloud_saves")).rows.length, 0, "Bob cannot read Alice's card");
    assert.equal((await write(1, 1, newSave("BOB"))).rows.length, 0, "Bob cannot mutate Alice's slot");
    assert.equal((await write(1, 0, newSave("BOB"))).rows.length, 1, "Bob has an independent card");
    for (const slot of [0, 4, 16]) await assert.rejects(write(slot, 0, save), /invalid_slot_or_revision/);
    await assert.rejects(write(2, -1, save), /invalid_slot_or_revision/);
    for (const data of [{}, { ...save, version: null }, { ...save, player: [] }]) {
      await assert.rejects(write(2, 0, data), /cloud_save_shape/);
    }
    await assert.rejects(write(2, 0, { ...save, padding: "x".repeat(262144) }), /cloud_save_size/);
    await db.exec("reset role; update public.cloud_saves set updated_at = now() - interval '3 seconds';");
    await login(alice);
    const deleted = await write(1, 1, null);
    assert.equal(deleted.rows.length, 1);
    assert.equal(Number(deleted.rows[0].revision), 2);
    assert.equal(deleted.rows[0].data, null);
    assert.equal((await write(1, 1, save)).rows.length, 0, "stale device cannot resurrect a deleted save");
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from public.cloud_saves"), /permission denied/);
    await assert.rejects(write(1, 0, save), /permission denied/);
    await login("");
    await assert.rejects(write(1, 0, save), /authentication_required/);
  } finally { await db.close(); }
});
