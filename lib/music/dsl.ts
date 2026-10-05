// Tracker-style song format: plain data plus a few helpers that expand shorthand into
// one token per step. No browser APIs here, so Node (tests) can import it directly.
//
// Step tokens (one per step, space separated):
//   "C5"      note on (sharps "C#5" or flats "Bb4")
//   "/E5"     note on with a quick slide from the previous note on the same channel
//   "C5=047"  arpeggio: cycles fast through the offsets (hex digits, c = 12 semitones)
//   "."       hold: the previous note (or rest) keeps sounding
//   "-"       rest: the previous note stops
// Drum tokens: k kick, s snare, x kick+snare, h hat, o open hat, c crash (+kick), m metal clank,
//   T high tom, t low tom, "." nothing.

export const STEPS_PER_BAR = 16;

export type Channel = "lead" | "harm" | "bass" | "drums";
export const CHANNELS: Channel[] = ["lead", "harm", "bass", "drums"];

export type Wave = "pulse12" | "pulse25" | "pulse50" | "triangle";

export type Timbre = {
  wave: Wave;
  vol: number;
  /** cents, for a slightly chorused second pulse */
  detune?: number;
  /** vibrato depth in cents on long notes */
  vibrato?: number;
  /** fraction of the note length that actually sounds (staccato < 1) */
  gate?: number;
  /** sustain level after the attack, 0..1 (1 = organ-like) */
  sustain?: number;
};

export type Section = {
  name: string;
  /** space separated pattern names, each optionally repeated with "*n" */
  lead: string;
  /** a pattern list, or "~3" (diatonic third below the lead) or "~echo" (lead delayed 3 steps) */
  harm: string;
  bass: string;
  drums: string;
  /** semitone transposition for every pitched channel */
  tr?: number;
};

export type Song = {
  title: string;
  bpm: number;
  stepsPerBeat: number;
  /** "A minor", "D major"... used by the "~3" harmonizer */
  key: string;
  /** index into `order` where the loop restarts (so the intro plays once) */
  loop: number;
  /** jingles play once and stop */
  oneShot?: boolean;
  mix: { lead: Timbre; harm: Timbre; bass: Timbre; drums: number };
  patterns: Record<string, string>;
  order: Section[];
};

// ─── notes ────────────────────────────────────────────────────────────────
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_RE = /^([A-G])(#|b)?(-?\d)$/;
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteToMidi(s: string): number {
  const m = NOTE_RE.exec(s);
  if (!m) throw new Error(`bad note "${s}"`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
export const midiToName = (m: number) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ─── shorthand expansion ──────────────────────────────────────────────────
/** "E5*4" → "E5 . . ."; "-*3" → "- . ."; "|" bar lines are checked and dropped. */
function expand(src: string, what: string): string[] {
  const out: string[] = [];
  let barStart = 0;
  const bar = () => {
    const n = out.length - barStart;
    if (n !== STEPS_PER_BAR) throw new Error(`${what}: bar ${Math.floor(barStart / STEPS_PER_BAR) + 1} has ${n} steps`);
    barStart = out.length;
  };
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === "|") { bar(); continue; }
    const [t, rep] = tok.split("*");
    const n = rep ? Number(rep) : 1;
    if (!Number.isInteger(n) || n < 1) throw new Error(`${what}: bad repeat "${tok}"`);
    out.push(t);
    for (let i = 1; i < n; i++) out.push(".");
  }
  if (out.length > barStart) bar();
  return out;
}

/** A melody line written with durations: "E5*2 G5*2 C6*4 | ..." (each bar must be 16 steps). */
export function line(src: string): string {
  const toks = expand(src, `line "${src.slice(0, 24)}…"`);
  for (const t of toks) if (t !== "." && t !== "-") parseNote(t);
  return toks.join(" ");
}

/** Drums, one char per step, spaces ignored: "k.h.s.h.k.h.s.h." */
export function drums(src: string): string {
  const chars = src.replace(/\s+/g, "").split("");
  if (chars.length % STEPS_PER_BAR) throw new Error(`drums "${src}" is ${chars.length} steps`);
  for (const c of chars) if (!"ksocmhxTt.".includes(c)) throw new Error(`bad drum "${c}"`);
  return chars.join(" ");
}

// ─── chords ───────────────────────────────────────────────────────────────
const QUALITY: Record<string, number[]> = {
  "": [0, 4, 7, 10], m: [0, 3, 7, 10], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  dim: [0, 3, 6, 9], sus4: [0, 5, 7, 10], sus2: [0, 2, 7, 10], aug: [0, 4, 8, 10], "5": [0, 7, 7, 12],
};
type Chord = { pc: number; iv: number[] };
function parseChord(s: string): Chord {
  const m = /^([A-G])(#|b)?(.*)$/.exec(s);
  if (!m || !(m[3] in QUALITY)) throw new Error(`bad chord "${s}"`);
  return { pc: (PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12, iv: QUALITY[m[3]] };
}
/** "1 3 5 7 8" are chord tones, "t" the third an octave up, "c"/"C" a fast arpeggio of the chord. */
function chordTone(ch: Chord, base: number, d: string): string {
  const root = base + ch.pc;
  switch (d) {
    case "1": return midiToName(root);
    case "3": return midiToName(root + ch.iv[1]);
    case "5": return midiToName(root + ch.iv[2]);
    case "7": return midiToName(root + ch.iv[3]);
    case "8": return midiToName(root + 12);
    case "t": return midiToName(root + 12 + ch.iv[1]);
    case "4": return midiToName(root - 12 + ch.iv[2]); // fifth below
    case "c": return `${midiToName(root)}=${[0, ch.iv[1], ch.iv[2]].map((x) => x.toString(16)).join("")}`;
    case "C": return `${midiToName(root)}=${[0, ch.iv[1], ch.iv[2], 12].map((x) => x.toString(16)).join("")}`;
    default: throw new Error(`bad chord degree "${d}"`);
  }
}
/**
 * Render a chord progression through a one-bar rhythm template (or a list cycled per bar).
 * `chords` has one token per bar; "Am,G" splits the bar in two halves.
 */
function voiced(chords: string, templates: string | string[], base: number): string {
  const tpl = (Array.isArray(templates) ? templates : [templates]).map((t) => expand(t, `template "${t}"`));
  const out: string[] = [];
  chords.trim().split(/\s+/).forEach((bar, i) => {
    const parts = bar.split(",").map(parseChord);
    tpl[i % tpl.length].forEach((d, s) => {
      const ch = parts[Math.min(parts.length - 1, Math.floor((s * parts.length) / STEPS_PER_BAR))];
      out.push(d === "." || d === "-" ? d : chordTone(ch, base, d));
    });
  });
  return out.join(" ");
}
/** Bass: roots land in C2..B2. */
export const bass = (chords: string, templates: string | string[]) => voiced(chords, templates, 36);
/** Harmony / arpeggio voice: roots land in C4..B4 (or `base` octave). */
export const chords = (progression: string, templates: string | string[], base = 60) => voiced(progression, templates, base);

/** Silence of n bars (for intros where a channel waits). */
export const rest = (bars: number) => Array.from({ length: bars * STEPS_PER_BAR }, (_, i) => (i ? "." : "-")).join(" ");

// ─── compiler ─────────────────────────────────────────────────────────────
export type NoteEv = { midi: number; len: number; slide?: boolean; arp?: number[] };
export type CompiledSection = {
  name: string;
  len: number;
  lead: (NoteEv | null)[];
  harm: (NoteEv | null)[];
  bass: (NoteEv | null)[];
  drums: (string | null)[];
};
export type CompiledSong = {
  name: string;
  song: Song;
  stepDur: number;
  sections: CompiledSection[];
  introSeconds: number;
  loopSeconds: number;
};

function parseNote(t: string): { midi: number; slide: boolean; arp?: number[] } {
  const slide = t.startsWith("/");
  const [n, a] = (slide ? t.slice(1) : t).split("=");
  return { midi: noteToMidi(n), slide, arp: a ? a.split("").map((c) => parseInt(c, 16)) : undefined };
}

/** Expands "a1 a2*2" into the concatenated step tokens; unknown names are reported. */
export function resolveSeq(song: Song, seq: string, missing?: string[]): string[] {
  const out: string[] = [];
  for (const ref of seq.trim().split(/\s+/)) {
    const [name, rep] = ref.split("*");
    const pat = song.patterns[name];
    if (pat == null) { missing?.push(name); continue; }
    const toks = pat.split(" ");
    for (let i = 0; i < (rep ? Number(rep) : 1); i++) out.push(...toks);
  }
  return out;
}

const SCALES: Record<string, number[]> = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
function harmonizeThird(tok: string, key: string): string {
  if (tok === "." || tok === "-") return tok;
  const { midi } = parseNote(tok);
  const [tonic, mode] = key.split(" ");
  const scale = SCALES[mode] ?? SCALES.major;
  const rel = (((midi - noteToMidi(`${tonic}4`)) % 12) + 12) % 12;
  const i = scale.indexOf(rel);
  const down = i < 0 ? 4 : (scale[i] - scale[(i + 5) % 7] + 12) % 12;
  return midiToName(midi - down);
}

/** Token list for one channel of a section (with the "~3" / "~echo" harmony tricks). */
export function channelTokens(song: Song, sec: Section, ch: Channel, missing?: string[]): string[] {
  const seq = sec[ch];
  if (ch === "harm" && seq === "~3") return resolveSeq(song, sec.lead).map((t) => harmonizeThird(t, song.key));
  if (ch === "harm" && seq === "~echo") {
    const lead = resolveSeq(song, sec.lead).map((t) => t.replace(/^\//, ""));
    return lead.map((_, i) => (i < 3 ? (i ? "." : "-") : lead[i - 3]));
  }
  return resolveSeq(song, seq, missing);
}

function compileNotes(toks: string[], tr: number): (NoteEv | null)[] {
  return toks.map((t, i) => {
    if (t === "." || t === "-") return null;
    const n = parseNote(t);
    let len = 1;
    while (toks[i + len] === ".") len++;
    return { midi: n.midi + tr, len, slide: n.slide || undefined, arp: n.arp };
  });
}

export function compileSong(name: string, song: Song): CompiledSong {
  const stepDur = 60 / song.bpm / song.stepsPerBeat;
  const sections = song.order.map((sec): CompiledSection => {
    const tr = sec.tr ?? 0;
    const lead = channelTokens(song, sec, "lead");
    const len = lead.length;
    const fit = <T,>(a: T[]): T[] => Array.from({ length: len }, (_, i) => a[i] ?? (null as T));
    return {
      name: sec.name,
      len,
      lead: compileNotes(lead, tr),
      harm: fit(compileNotes(channelTokens(song, sec, "harm"), tr)),
      bass: fit(compileNotes(channelTokens(song, sec, "bass"), tr)),
      drums: fit(channelTokens(song, sec, "drums").map((t) => (t === "." ? null : t))),
    };
  });
  const steps = (from: number, to: number) => sections.slice(from, to).reduce((a, s) => a + s.len, 0);
  return {
    name,
    song,
    stepDur,
    sections,
    introSeconds: steps(0, song.loop) * stepDur,
    loopSeconds: steps(song.loop, sections.length) * stepDur,
  };
}

/** Structural problems with a song (used by the tests). */
export function validateSong(song: Song): string[] {
  const errs: string[] = [];
  if (!(song.loop >= 0 && song.loop < song.order.length)) errs.push(`loop ${song.loop} out of range`);
  song.order.forEach((sec, i) => {
    const missing: string[] = [];
    const lens = CHANNELS.map((ch) => channelTokens(song, sec, ch, missing).length);
    for (const m of missing) errs.push(`section ${i} (${sec.name}): missing pattern "${m}"`);
    if (lens[0] === 0 || lens[0] % STEPS_PER_BAR) errs.push(`section ${i} (${sec.name}): lead is ${lens[0]} steps`);
    CHANNELS.forEach((ch, c) => {
      if (lens[c] !== lens[0]) errs.push(`section ${i} (${sec.name}): ${ch} is ${lens[c]} steps, lead is ${lens[0]}`);
    });
  });
  return errs;
}
