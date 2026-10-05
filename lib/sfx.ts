"use client";
// Tiny chiptune synth on WebAudio: no audio assets, everything is square/triangle/noise.
// Sound effects live here; music is tracker data in lib/music/songs.ts played by lib/music/synth.ts.
import { compileSong, type CompiledSong } from "./music/dsl.ts";
import { SongPlayer } from "./music/synth.ts";
import { SONGS, resolveSong } from "./music/songs.ts";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxOn = true;
let musicOn = true;

function load() {
  try {
    sfxOn = localStorage.getItem("bwq:sfx") !== "0";
    musicOn = localStorage.getItem("bwq:music") !== "0";
  } catch {}
}
if (typeof window !== "undefined") load();

let unlocked = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // Browsers block audio until the user interacts; don't even create the context before that.
  const active = unlocked || (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
  if (!active) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = musicOn ? MUSIC_VOL : 0;
    musicGain.connect(master);
    // a screen may have asked for music before the first click unlocked audio
    if (wanted) setTimeout(() => startWanted(), 0);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; slide?: number; delay?: number; out?: GainNode | null } = {}) {
  const c = ac();
  if (!c || !master) return;
  const out = opts.out ?? master;
  if (out === master && !sfxOn) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? "square";
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
  const v = opts.vol ?? 0.3;
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.3, delay = 0) {
  const c = ac();
  if (!c || !master || !sfxOn) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(g).connect(master);
  src.start(c.currentTime + delay);
}

const N = (semi: number) => 440 * Math.pow(2, semi / 12); // semitones from A4

export const sfx = {
  unlock: () => { unlocked = true; void ac(); },
  blip: (pitch = 0) => tone(N(3 + pitch), 0.04, { vol: 0.12 }),
  text: () => tone(N(-2 + Math.floor(Math.random() * 4)), 0.03, { vol: 0.06 }),
  select: () => { tone(N(7), 0.05, { vol: 0.18 }); tone(N(12), 0.06, { vol: 0.18, delay: 0.05 }); },
  hover: () => tone(N(10), 0.02, { vol: 0.05 }),
  correct: (combo = 0) => {
    const b = Math.min(combo, 8);
    [0, 4, 7, 12].forEach((s, i) => tone(N(s + b), 0.08, { vol: 0.2, delay: i * 0.05 }));
  },
  perfect: () => [0, 4, 7, 12, 16, 19].forEach((s, i) => tone(N(s + 5), 0.07, { vol: 0.18, delay: i * 0.04 })),
  wrong: () => { tone(N(-5), 0.12, { vol: 0.25, slide: N(-17) }); tone(N(-6), 0.18, { vol: 0.2, delay: 0.1, slide: N(-20) }); },
  hit: () => { noise(0.12, 0.35); tone(N(-12), 0.1, { vol: 0.25, slide: N(-24) }); },
  hurt: () => { noise(0.2, 0.3); tone(N(-8), 0.2, { type: "sawtooth", vol: 0.15, slide: N(-30) }); },
  coin: () => { tone(N(14), 0.06, { vol: 0.15 }); tone(N(19), 0.12, { vol: 0.15, delay: 0.06 }); },
  star: (i = 0) => tone(N(12 + i * 4), 0.15, { vol: 0.2, type: "triangle" }),
  key: () => tone(N(15 + Math.floor(Math.random() * 3)), 0.025, { vol: 0.08 }),
  whoosh: () => tone(N(0), 0.15, { vol: 0.08, slide: N(24), type: "triangle" }),
  drop: () => { tone(N(12), 0.2, { vol: 0.15, slide: N(-12), type: "triangle" }); noise(0.1, 0.1, 0.1); },
  levelUp: () => [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => tone(N(s), 0.1, { vol: 0.2, delay: i * 0.07 })),
  start: () => [12, 7, 12, 16, 19, 24].forEach((s, i) => tone(N(s), 0.09, { vol: 0.2, delay: i * 0.08 })),
  boom: () => { noise(0.5, 0.4); tone(N(-24), 0.5, { vol: 0.3, slide: N(-36), type: "triangle" }); },
  gameOver: () => [7, 3, 0, -5].forEach((s, i) => tone(N(s), 0.25, { vol: 0.2, delay: i * 0.22, type: "triangle" })),
};

// ─── music: tracker songs (lib/music) on a lookahead scheduler ─────────────
const MUSIC_VOL = 0.35;
const LOOKAHEAD = 0.12; // seconds scheduled ahead of the audio clock
const TICK_MS = 25;
const compiled = new Map<string, CompiledSong>();
const songFor = (id: string) => {
  let c = compiled.get(id);
  if (!c) compiled.set(id, (c = compileSong(id, SONGS[id])));
  return c;
};

let wanted: string | null = null; // name the screen asked for ("lesson", "map:rust"...)
let player: SongPlayer | null = null;
let playerSong: string | null = null; // resolved song id of `player`
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  if (!ctx || !player) return;
  player.scheduleUntil(ctx.currentTime + LOOKAHEAD);
  if (player.done) stopTimer(); // one-shot jingle finished
}
function startTimer() {
  if (timer || typeof document === "undefined" || document.hidden) return;
  timer = setInterval(tick, TICK_MS);
  tick();
}
function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}
function fadeAway(p: SongPlayer, dur: number) {
  p.fadeOut(dur);
  setTimeout(() => p.dispose(), dur * 1000 + 200);
}

/** Starts (or cross-fades to) the song for `wanted`, when audio is allowed. */
function startWanted(fade = 0.35) {
  if (!wanted || !musicOn) return;
  const c = ac();
  if (!c || !musicGain) return;
  const id = resolveSong(wanted);
  if (!id) return;
  if (player && playerSong === id && !player.done) return startTimer();
  const old = player;
  if (old) fadeAway(old, fade);
  player = new SongPlayer(c, musicGain, songFor(id), c.currentTime + (old ? 0.08 : 0.05), old ? 0.25 : 0.05);
  playerSong = id;
  stopTimer();
  startTimer();
}

function haltPlayer(fade: number) {
  stopTimer();
  if (player) fadeAway(player, fade);
  player = null;
  playerSong = null;
}

if (typeof document !== "undefined") {
  // Hidden tabs throttle timers; pause scheduling and pick up cleanly when visible again.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopTimer(); return; }
    if (ctx && player && !player.done) { player.resync(ctx.currentTime); startTimer(); }
  });
}

export const music = {
  /**
   * Play a track by name: "title", "card", "galaxy", "map:<slug>" (falls back to "map:default"),
   * "lesson" (random variant), "boss", "exam", "result", or a one-shot "jingle:clear" / "jingle:gameover".
   * Calling it again with the same name keeps the song going.
   */
  play(name: string) {
    if (wanted === name && player && !player.done) return;
    wanted = name;
    startWanted();
  },
  /** World map theme for a planet or moon (unknown slugs get the default overworld). */
  playMap(slug: string) {
    music.play(`map:${slug}`);
  },
  stop() {
    wanted = null;
    haltPlayer(0.25);
  },
  /** Song names available, for debugging. */
  get tracks() { return Object.keys(SONGS); },
};

export const audioPrefs = {
  get sfx() { return sfxOn; },
  get music() { return musicOn; },
  setSfx(v: boolean) { sfxOn = v; try { localStorage.setItem("bwq:sfx", v ? "1" : "0"); } catch {} },
  setMusic(v: boolean) {
    musicOn = v;
    try { localStorage.setItem("bwq:music", v ? "1" : "0"); } catch {}
    if (musicGain) musicGain.gain.value = v ? MUSIC_VOL : 0;
    if (v) startWanted(0.1);
    else haltPlayer(0.15);
  },
};
