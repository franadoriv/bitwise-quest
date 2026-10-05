// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeSave, encodeSave, exportFileName, fromBase64, toBase64 } from "../lib/save/codec.ts";
import { SaveError, migrate } from "../lib/save/migrate.ts";
import { SAVE_VERSION, langOf, newSave } from "../lib/save/schema.ts";

test("encode/decode round-trips a save", async () => {
  const s = newSave("Ada");
  langOf(s, "rust").lessons["hello-let"] = { stars: 3, best: 900, plays: 1, doneAt: 1, recent: "1101" };
  const bytes = await encodeSave(s);
  assert.deepEqual(await decodeSave(bytes), s);
  assert.deepEqual(await decodeSave(fromBase64(toBase64(bytes))), s);
});

test("files are not readable and differ on every export", async () => {
  const s = newSave("Ada");
  const a = await encodeSave(s);
  const b = await encodeSave(s);
  assert.notDeepEqual(a, b);
  assert.ok(!new TextDecoder().decode(a).includes("Ada"));
});

test("any modified byte is rejected", async () => {
  const bytes = await encodeSave(newSave("Ada"));
  bytes[bytes.length - 3] ^= 0x01;
  await assert.rejects(decodeSave(bytes), (e: SaveError) => e.code === "checksum");
});

test("non-save files are rejected", async () => {
  await assert.rejects(decodeSave(new TextEncoder().encode("hello world, not a save")), (e: SaveError) => e.code === "format");
});

test("newer saves are refused, older shapes are normalized", () => {
  assert.throws(() => migrate({ version: SAVE_VERSION + 1 }), (e: SaveError) => e.code === "newer");
  const s = migrate({ version: 1, player: { name: "  Bob  " }, langs: { go: { lessons: { x: { stars: 1 } } }, future: { extra: true } }, unknownField: 42 });
  assert.equal(s.player.name, "Bob");
  assert.equal(s.stats.xp, 0);
  assert.deepEqual(s.langs.go.reviews, {});
  assert.equal((s.langs.future as unknown as { extra: boolean }).extra, true);
  assert.equal((s as unknown as { unknownField: number }).unknownField, 42);
});

test("export file name has player and seconds", () => {
  const s = newSave("Ñandú Ada!");
  assert.equal(exportFileName(s, new Date(2026, 9, 6, 9, 5, 7)), "BitwiseQuest_NanduAda_2026-10-06_09-05-07.bwq");
  assert.equal(exportFileName(newSave("ゆうき"), new Date(2026, 0, 2, 3, 4, 5)), "BitwiseQuest_ゆうき_2026-01-02_03-04-05.bwq");
  assert.equal(exportFileName(newSave("!!!"), new Date(2026, 0, 2, 3, 4, 5)), "BitwiseQuest_Player_2026-01-02_03-04-05.bwq");
});

// ─── progress ───────────────────────────────────────────────────────────────
import { completeExam, completeLesson, completeReview, dueReviews, worldState, type WorldContent } from "../lib/save/progress.ts";

const content: WorldContent = {
  regions: [
    { slug: "a", name: "A", subtitle: "", theme: "village", status: "active", lessons: [{ slug: "a1", title: "A1", mode: "lesson", xp: 40 }, { slug: "a2", title: "A2", mode: "boss", xp: 100 }] },
    { slug: "b", name: "B", subtitle: "", theme: "forest", status: "active", lessons: [{ slug: "b1", title: "B1", mode: "lesson", xp: 60 }] },
  ],
};

test("lessons unlock in order and rewards accumulate", () => {
  let s = newSave("Ada");
  let w = worldState(content, s.langs.rust);
  assert.equal(w.isNew, true);
  assert.deepEqual(w.regions.flatMap((r) => r.lessons.map((l) => l.unlocked)), [true, false, false]);
  const r1 = completeLesson(s, "rust", content, content.regions[0].lessons[0], { score: 500, mistakes: 1, maxCombo: 3, correct: 5, attempts: [{ beat: 2, correct: false }, { beat: 3, correct: true }] }, 1000);
  s = r1.save;
  assert.equal(r1.reward.stars, 2);
  assert.equal(r1.reward.nextLesson, "a2");
  assert.ok(s.stats.xp > 0);
  assert.equal(s.langs.rust.lessons.a1.recent, "01");
  assert.deepEqual(dueReviews(s.langs.rust, 1000 + 11 * 60_000), ["a1#2"]);
  w = worldState(content, s.langs.rust);
  assert.deepEqual(w.regions.flatMap((r) => r.lessons.map((l) => l.unlocked)), [true, true, false]);
  s = completeReview(s, "rust", [{ key: "a1#2", correct: true }], 100, 2000).save;
  assert.equal(s.langs.rust.reviews["a1#2"].box, 2);
});

test("exams skip mastered regions in order", () => {
  const meta = { slug: "junior", title: "J", passPct: 70, topics: { va: { name: "VA", region: "a" }, vb: { name: "VB", region: "b" } }, regions: [{ slug: "a", name: "A", lessons: ["a1", "a2"] }, { slug: "b", name: "B", lessons: ["b1"] }] };
  const { save, report } = completeExam(newSave("Ada"), "rust", meta, [{ topic: "va", correct: true }, { topic: "va", correct: true }, { topic: "vb", correct: false }, { topic: "vb", correct: true }]);
  assert.equal(report.pct, 75);
  assert.equal(report.passed, true);
  assert.deepEqual(report.skippedRegions, ["A"]);
  assert.equal(save.langs.rust.lessons.a2.skipped, true);
  assert.equal(save.langs.rust.lessons.b1, undefined);
  assert.equal(worldState(content, save.langs.rust).regions[1].unlocked, true);
});
