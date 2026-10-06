// Run: npm test
// Structural checks for the tracker songs: we cannot listen in CI, so check shape, length and range.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileSong, resolveSeq, validateSong, type CompiledSong } from "../lib/music/dsl.ts";
import { SONGS, resolveSong } from "../lib/music/songs.ts";

const compiled: CompiledSong[] = Object.entries(SONGS).map(([name, s]) => compileSong(name, s));
const looping = compiled.filter((c) => !c.song.oneShot);

test("every song is structurally valid (patterns exist, channels align)", () => {
  for (const [name, song] of Object.entries(SONGS)) assert.deepEqual(validateSong(song), [], name);
});

test("every channel of every compiled section has the section length", () => {
  for (const c of compiled) {
    for (const s of c.sections) {
      assert.ok(s.len > 0 && s.len % 16 === 0, `${c.name}/${s.name} is ${s.len} steps`);
      for (const ch of ["lead", "harm", "bass", "drums"] as const) assert.equal(s[ch].length, s.len, `${c.name}/${s.name}/${ch}`);
    }
  }
});

test("looping songs are long enough not to get tiring", () => {
  for (const c of looping) {
    const min = c.name === "result" ? 20 : 45;
    assert.ok(c.loopSeconds >= min, `${c.name} loops after ${c.loopSeconds.toFixed(1)} s (min ${min})`);
    assert.ok(c.loopSeconds <= 130, `${c.name} loop is ${c.loopSeconds.toFixed(1)} s`);
    assert.ok(c.song.loop >= 0 && c.song.loop < c.sections.length, `${c.name} loop point`);
    const leads = new Set(c.song.order.slice(c.song.loop).map((s) => `${s.lead}|${s.harm}|${s.tr ?? 0}`));
    assert.ok(leads.size >= 3, `${c.name} needs at least 3 distinct sections in its loop`);
  }
});

test("jingles are short one-shots", () => {
  for (const c of compiled.filter((c) => c.song.oneShot)) {
    assert.ok(c.introSeconds + c.loopSeconds < 15, `${c.name} is too long`);
  }
});

test("notes stay in a sensible range (bass low, leads mid-high)", () => {
  for (const c of compiled) {
    for (const s of c.sections) {
      for (const ch of ["lead", "harm", "bass"] as const) {
        const [lo, hi] = ch === "bass" ? [28, 64] : [55, 100];
        for (const ev of s[ch]) {
          if (!ev) continue;
          const top = ev.midi + Math.max(0, ...(ev.arp ?? [0]));
          assert.ok(ev.midi >= lo && top <= hi, `${c.name}/${s.name}/${ch}: midi ${ev.midi}..${top} outside ${lo}..${hi}`);
          assert.ok(ev.len >= 1, `${c.name}/${s.name}/${ch}: empty note`);
        }
      }
      for (const d of s.drums) if (d) assert.match(d, /^[ksxhocmTt]$/, `${c.name}/${s.name}: drum "${d}"`);
    }
  }
});

test("no two songs share a lead pattern", () => {
  const owner = new Map<string, string>();
  for (const [name, song] of Object.entries(SONGS)) {
    const refs = new Set(song.order.flatMap((s) => s.lead.trim().split(/\s+/).map((r) => r.split("*")[0])));
    for (const ref of refs) {
      const data = resolveSeq(song, ref).join(" ");
      if (!/[A-G]/.test(data)) continue; // silent bars are fine to share
      const prev = owner.get(data);
      assert.ok(!prev || prev === name, `lead "${ref}" of ${name} duplicates ${prev}`);
      owner.set(data, name);
    }
  }
});

test("track names used by screens resolve, with fallbacks", () => {
  for (const n of ["title", "card", "galaxy", "boss", "exam", "result", "map:rust", "map:typescript", "map:go", "map:python", "map:cpp", "map:csharp", "map:webgl", "map:threejs", "map:default", "jingle:clear", "jingle:gameover"]) {
    assert.equal(resolveSong(n), n);
  }
  assert.equal(resolveSong("map:react"), "map:default");
  assert.equal(resolveSong("map:zig"), "map:default");
  assert.equal(resolveSong("lesson", () => 0), "lesson:a");
  assert.equal(resolveSong("lesson", () => 0.99), "lesson:b");
  assert.equal(resolveSong("nope"), null);
});
