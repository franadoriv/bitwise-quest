"use client";
// Tiny chiptune synth on WebAudio: no audio assets, everything is square/triangle/noise.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxOn = true;
let musicOn = true;

function load() {
  try {
    sfxOn = localStorage.getItem("bf:sfx") !== "0";
    musicOn = localStorage.getItem("bf:music") !== "0";
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
    musicGain.gain.value = musicOn ? 0.35 : 0;
    musicGain.connect(master);
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

// ─── music: a very small step sequencer ───────────────────────────────────
type Song = { bpm: number; lead: (number | null)[]; bass: (number | null)[] };
const SONGS: Record<string, Song> = {
  map: {
    bpm: 120,
    lead: [12, null, 16, 19, 17, null, 16, 14, 12, null, 14, 16, 14, null, 7, null, 9, null, 12, 14, 16, null, 14, 12, 11, null, 12, 14, 12, null, null, null],
    bass: [0, null, 0, null, -3, null, -3, null, -7, null, -7, null, -5, null, -5, null],
  },
  battle: {
    bpm: 150,
    lead: [12, 12, 15, 12, 17, 15, 12, 10, 12, 12, 15, 17, 19, 17, 15, 17, 12, 12, 15, 12, 17, 15, 12, 10, 8, 10, 12, 15, 12, null, null, null],
    bass: [-12, -12, 0, -12, -12, -12, 0, -12, -16, -16, -4, -16, -14, -14, -2, -14],
  },
};
let timer: ReturnType<typeof setInterval> | null = null;
let current: string | null = null;

export const music = {
  play(name: keyof typeof SONGS) {
    if (current === name && timer) return;
    music.stop();
    current = name;
    const song = SONGS[name];
    let step = 0;
    const stepDur = 60 / song.bpm / 2;
    timer = setInterval(() => {
      if (!ctx || !musicOn) { step++; return; }
      const l = song.lead[step % song.lead.length];
      const b = song.bass[step % song.bass.length];
      if (l != null) tone(N(l), stepDur * 0.9, { vol: 0.12, type: "square", out: musicGain });
      if (b != null) tone(N(b - 12), stepDur * 0.95, { vol: 0.2, type: "triangle", out: musicGain });
      step++;
    }, stepDur * 1000);
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
    current = null;
  },
};

export const audioPrefs = {
  get sfx() { return sfxOn; },
  get music() { return musicOn; },
  setSfx(v: boolean) { sfxOn = v; try { localStorage.setItem("bf:sfx", v ? "1" : "0"); } catch {} },
  setMusic(v: boolean) {
    musicOn = v;
    try { localStorage.setItem("bf:music", v ? "1" : "0"); } catch {}
    if (musicGain) musicGain.gain.value = v ? 0.35 : 0;
  },
};
