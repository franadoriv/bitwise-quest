// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { decodeSave, encodeSave, exportFileName, fromBase64, toBase64 } from "../lib/save/codec.ts";
import { SaveError, migrate } from "../lib/save/migrate.ts";
import { SAVE_VERSION, langOf, newSave } from "../lib/save/schema.ts";
import { MAX_SAVE_BYTES, validateSaveInput } from "../lib/save/validate.ts";

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

test("valid checksums do not allow malformed saves or prototype keys", async () => {
  const invalid = [
    { ...newSave("Ada"), stats: { xp: -1 } },
    { ...newSave("Ada"), player: { name: {} } },
    { ...newSave("Ada"), langs: { rust: { lessons: { x: { stars: 8 } } } } },
    { ...newSave("Ada"), langs: { rust: { reviews: { x: { due: "tomorrow" } } } } },
    JSON.parse('{"version":2,"langs":{"__proto__":{"polluted":true}}}'),
  ];
  for (const save of invalid) await assert.rejects(decodeSave(await encodeSave(save as never)), (e: SaveError) => e.code === "corrupt");
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
});

test("imports reject oversized files, unsupported flags and mismatched version headers", async () => {
  await assert.rejects(decodeSave(new Uint8Array(MAX_SAVE_BYTES + 1)), (e: SaveError) => e.code === "format");
  const flags = await encodeSave(newSave("Ada")); flags[7] |= 128;
  await assert.rejects(decodeSave(flags), (e: SaveError) => e.code === "corrupt");
  const version = await encodeSave(newSave("Ada")); version[5] = 1;
  await assert.rejects(decodeSave(version), (e: SaveError) => e.code === "corrupt");
});

test("a tiny valid-checksum file cannot expand beyond the import budget", async () => {
  // A 2 KB fixture with valid magic, flags and CRC expands to 2,000,001 bytes.
  const bomb = await readFile(new URL("./fixtures/oversized-save.bwq", import.meta.url));
  assert.ok(bomb.length < 3000);
  await assert.rejects(decodeSave(bomb), (e: SaveError) => e.code === "format");
});

test("validation bounds deeply nested imports but preserves safe unknown fields", () => {
  let deep: object = {};
  for (let n = 0; n < 55; n++) deep = { child: deep };
  assert.throws(() => validateSaveInput({ ...newSave("Ada"), future: deep }), (e: SaveError) => e.code === "corrupt");
  assert.doesNotThrow(() => validateSaveInput({ ...newSave("Ada"), langs: { future: { extra: true } }, future: { harmless: [1, 2, 3] } }));
  assert.doesNotThrow(() => validateSaveInput({ ...newSave("Ada"), langs: { rust: { practice: { "count-vowels": { plays: 2, best: 300, solvedAt: 5 } } } } }));
  assert.throws(() => validateSaveInput({ ...newSave("Ada"), langs: { rust: { practice: { x: { plays: "2" } } } } }), (e: SaveError) => e.code === "corrupt");
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
import { TICKET_PRICE, buyTicket, completeExam, completeLesson, completeReview, dueReviews, setTimerPref, spendTicket, worldState, type WorldContent } from "../lib/save/progress.ts";

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

test("v1 saves migrate to v2 with hint tickets and the default timer", () => {
  const s = migrate({ version: 1, player: { name: "Ada" }, stats: { xp: 50, coins: 12 }, langs: {} });
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.stats.tickets, 5);
  assert.equal(s.stats.coins, 12);
  assert.equal(s.prefs.timer, "normal");
  // an invalid timer value is repaired, unknown prefs survive
  const t = migrate({ version: 2, prefs: { timer: "warp", future: 1 }, stats: { tickets: 2 } });
  assert.equal(t.prefs.timer, "normal");
  assert.equal(t.stats.tickets, 2);
  assert.equal((t.prefs as unknown as { future: number }).future, 1);
});

test("v2 saves migrate to v3 with an empty practice record per planet, keeping everything else", () => {
  const s = migrate({
    version: 2,
    player: { name: "Ada" },
    stats: { xp: 80, tickets: 3 },
    prefs: { timer: "fast" },
    langs: { rust: { lessons: { "hello-let": { stars: 3, best: 900, plays: 1, doneAt: 1, recent: "11" } }, reviews: {}, exams: {}, future: 7 } },
  });
  assert.equal(s.version, 3);
  assert.deepEqual(s.langs.rust.practice, {});
  assert.equal(s.langs.rust.lessons["hello-let"].stars, 3);
  assert.equal((s.langs.rust as unknown as { future: number }).future, 7);
  assert.equal(s.prefs.timer, "fast");
});

test("hint tickets: spend, buy, and earn by perfect clears and daily play", () => {
  const s = newSave("Ada");
  assert.equal(s.stats.tickets, 5);
  const spent = spendTicket(s)!;
  assert.equal(spent.stats.tickets, 4);
  assert.equal(s.stats.tickets, 5, "pure: the original is untouched");
  assert.equal(spendTicket({ ...s, stats: { ...s.stats, tickets: 0 } }), null);

  assert.equal(buyTicket(s), null, "no coins yet");
  const rich = { ...s, stats: { ...s.stats, coins: TICKET_PRICE + 5 } };
  const bought = buyTicket(rich)!;
  assert.deepEqual([bought.stats.coins, bought.stats.tickets], [5, 6]);

  assert.equal(setTimerPref(s, "fast").prefs.timer, "fast");

  const world: WorldContent = { regions: [{ slug: "r", name: "R", subtitle: "", theme: "village", lessons: [{ slug: "a", title: "A", mode: "lesson", xp: 40 }, { slug: "b", title: "B", mode: "lesson", xp: 40 }] }] } as unknown as WorldContent;
  const day = Date.UTC(2026, 9, 6, 12);
  const perfect = completeLesson(s, "rust", world, { slug: "a", title: "A", mode: "lesson", xp: 40 }, { score: 900, mistakes: 0, maxCombo: 8, correct: 8, attempts: [] }, day);
  assert.equal(perfect.reward.stars, 3);
  assert.equal(perfect.reward.ticketsGained, 2, "3 stars + first play of the day");
  assert.equal(perfect.save.stats.tickets, 7);
  const again = completeLesson(perfect.save, "rust", world, { slug: "b", title: "B", mode: "lesson", xp: 40 }, { score: 100, mistakes: 3, maxCombo: 1, correct: 5, attempts: [] }, day + 1000);
  assert.equal(again.reward.ticketsGained, 0, "same day, not perfect");
  assert.equal(again.save.stats.tickets, 7);
});

test("timer: question time scales with code size and timer mode; notes cost 25%", async () => {
  const { questionSeconds, questionLimitMs, questionPoints } = await import("../lib/game-rules.ts");
  assert.equal(questionSeconds({ kind: "pick", code: "let x = 5;" }), 14);
  assert.ok(questionSeconds({ kind: "predict", code: "a\nb\nc\nd\ne\nf" }) > questionSeconds({ kind: "predict", code: "a" }));
  assert.equal(questionSeconds({ kind: "run" }), 120);
  assert.equal(questionSeconds({ kind: "pick", time: 33 }), 33);
  assert.equal(questionLimitMs({ kind: "pick", code: "x" }, "off"), 0);
  assert.equal(questionLimitMs({ kind: "pick", code: "x" }, "off", true), 14000, "bosses are always timed");
  assert.ok(questionLimitMs({ kind: "pick", code: "x" }, "relaxed") > questionLimitMs({ kind: "pick", code: "x" }, "fast"));
  assert.equal(questionPoints({ speed: 1, combo: 1, mode: "normal", usedNote: false }), 160);
  assert.equal(questionPoints({ speed: 1, combo: 1, mode: "fast", usedNote: false }), 190);
  assert.equal(questionPoints({ speed: 1, combo: 1, mode: "off", usedNote: false }), 100);
  assert.equal(questionPoints({ speed: 1, combo: 1, mode: "normal", usedNote: true }), 75);
  assert.equal(questionPoints({ speed: 0.5, combo: 3, mode: "normal", usedNote: false }), 156);
});

test("practice room: solves pay once (paper pays its own first solve), misses only count plays", async () => {
  const { completePractice } = await import("../lib/save/progress.ts");
  const task = { slug: "count-vowels", kind: "code" };
  const a = completePractice(newSave("Ada"), "python", task, { solved: false, paper: false, score: 0 }, 1000);
  assert.equal(a.reward.xpGained, 0);
  assert.deepEqual(a.save.langs.python.practice["count-vowels"], { plays: 1, best: 0 });
  const b = completePractice(a.save, "python", task, { solved: true, paper: false, score: 320 }, 2000);
  assert.equal(b.reward.xpGained, 40);
  assert.equal(b.save.langs.python.practice["count-vowels"].solvedAt, 2000);
  const c = completePractice(b.save, "python", task, { solved: true, paper: false, score: 100 }, 3000);
  assert.equal(c.reward.xpGained, 10);
  assert.equal(c.save.langs.python.practice["count-vowels"].best, 320);
  const d = completePractice(c.save, "python", task, { solved: true, paper: true, score: 400 }, 4000);
  assert.equal(d.reward.xpGained, 50);
  assert.equal(d.reward.stars, 3);
  assert.deepEqual(d.save.langs.python.practice["count-vowels"], { plays: 4, best: 400, solvedAt: 2000, paperAt: 4000 });
});
