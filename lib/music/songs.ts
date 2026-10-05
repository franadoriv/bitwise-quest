// Every song in the game, as tracker data. Original compositions.
// Format and helpers: ./dsl.ts. Add a planet theme as `"map:<language slug>"` (see docs/game-design.md#music).
import { bass, chords, drums, line, rest, type Section, type Song, type Timbre } from "./dsl.ts";

// ─── shared drum kit (one bar each) ───────────────────────────────────────
const KIT: Record<string, string> = {
  dE: drums("................"),
  d8: drums("k.h.s.h.k.h.s.h."),
  d8b: drums("k.h.s.h.k.k.s.hh"),
  dC: drums("c.h.s.h.k.h.s.h."),
  d16: drums("khhhshhhkhkhshhh"),
  dHalf: drums("k.h.h.h.s.h.h.h."),
  dFour: drums("k.h.x.h.k.h.x.ho"),
  dTech: drums("k.hhx.hkk.hhx.hh"),
  dGB: drums("k.hhs.hhk.hhs.hh"),
  dGB2: drums("k.hhs.hkk.hhs.hh"),
  dBoss: drums("k.hkshhkk.hkshhs"),
  dCozy: drums("k...h.h.s...h.h."),
  dCozy2: drums("k...h.h.s..kh.hh"),
  dSpace: drums("k.......h.....h."),
  dSpace2: drums("k.....h.s.....h."),
  dMetal: drums("k.m.s.mkk.m.s.mm"),
  dMetal2: drums("k.m.x.m.kkm.x.mm"),
  dAnvil: drums("m...m...m...m.mm"),
  dTick: drums("k...h...k...h..."),
  dTick2: drums("k...h...s...h.hh"),
  f1: drums("k.h.s.h.k.h.ssss"),
  f2: drums("k.s.s.k.s.TTtt.."),
  f3: drums("ssssTTTTttttkk.."),
  fSoft: drums("k...h.h.s.s.ssss"),
  fMetal: drums("k.m.s.mkk.ssTTtt"),
  fBoss: drums("ssssTTTTttttkkkk"),
};
const RESTS = { r1: rest(1), r2: rest(2), r3: rest(3), r4: rest(4) };

// ─── rhythm templates (one bar) ───────────────────────────────────────────
const B = {
  oct8: "1*2 8*2 1*2 8*2 1*2 8*2 1*2 8*2",
  disco: "1*2 8*2 1*2 8*2 5*2 8*2 5*2 8*2",
  root8: "1*2 1*2 1*2 1*2 1*2 1*2 1*2 1*2",
  pump: "1 1 8 1 1 1 8 1 1 1 8 1 1 8 5 8",
  gallop: "1*2 1 1 8*2 1 1 1*2 1 1 5*2 8*2",
  sync: "1*3 1*3 8*2 -*2 5*2 8*2 7*2",
  walk: "1*4 5*4 8*4 5*4",
  half: "1*8 5*8",
  whole: "1*16",
  tick: "1*2 -*2 1*2 -*2 1*2 -*2 1*2 -*2",
};
const H = {
  stab: "-*2 c*2 -*2 c*2 -*2 c*2 -*2 c*2",
  alberti: "1*2 5*2 8*2 5*2 3*2 5*2 8*2 5*2",
  broken: "1*2 5*2 8*2 5*2 1*2 5*2 8*2 5*2",
  up16: "1 3 5 8 1 3 5 8 1 3 5 8 1 3 5 8",
  sparkle: "1 5 8 t 1 5 8 t 1 5 8 t 1 5 8 t",
  roll: "1 5 8 5 1 5 8 5 1 5 8 5 1 5 8 5",
  pad: "C*16",
  pad2: "C*8 C*8",
  slow: "1*4 5*4 3*4 5*4",
};

const t = (wave: Timbre["wave"], vol: number, extra: Partial<Timbre> = {}): Timbre => ({ wave, vol, ...extra });
const sec = (name: string, lead: string, harm: string, bassSeq: string, drumSeq: string, tr?: number): Section =>
  ({ name, lead, harm, bass: bassSeq, drums: drumSeq, ...(tr ? { tr } : {}) });

// ─── TITLE: hero theme, C major → D major ─────────────────────────────────
const title: Song = {
  title: "Bitwise Overture",
  bpm: 150, stepsPerBeat: 4, key: "C major", loop: 1,
  mix: { lead: t("pulse25", 0.13, { vibrato: 12 }), harm: t("pulse12", 0.06), bass: t("triangle", 0.22), drums: 0.9 },
  patterns: {
    ...KIT, ...RESTS,
    intro: line("C5*2 C5 C5 G5*4 -*2 F5*2 E5*2 D5*2 | E5*12 -*4 | G4*2 G4 G4 D5*4 -*2 C5*2 B4*2 A4*2 | B4*8 /D5*8"),
    a1: line("E5*2 G5*2 C6*4 B5*2 G5*2 E5*2 D5*2 | E5*4 D5*2 C5*2 D5*6 G4*2 | A4*2 C5*2 E5*2 A5*2 G5*4 E5*2 C5*2 | F5*3 E5*3 D5*2 C5*4 D5*4"),
    a2: line("E5*2 G5*2 C6*4 B5*2 G5*2 E5*2 G5*2 | B5*4 A5*2 G5*2 D6*8 | C6*2 A5*2 F5*2 A5*2 C6*4 A5*2 F5*2 | G5*6 A5*2 B5*4 /D6*4"),
    b1: line("A5*6 G5*2 F5*4 E5*4 | D5*2 E5*2 F5*2 G5*2 A5*4 B5*4 | G5*6 E5*2 B4*4 E5*4 | C5*8 -*4 E5*2 A5*2"),
    b2: line("F5*4 A5*4 D6*4 C6*2 A5*2 | B5*4 G5*4 E5*4 G5*4 | A5*6 C6*2 F5*4 A5*4 | G5*2 F5*2 E5*2 D5*2 B4*4 D5*4"),
    c1: line("A4*4 -*2 C5*2 E5*4 -*4 | F5*4 -*2 E5*2 C5*4 -*4 | G5*4 -*2 E5*2 C5*4 E5*4 | D5*12 -*4"),
    hI: chords("C C G G7", "C*2 -*2 C*2 -*2 C*2 -*2 C*2 C*2"),
    hA1: chords("C G Am F", H.stab),
    hA2: chords("C G F G", H.stab),
    hB1: chords("F G Em Am", H.alberti),
    hB2: chords("Dm Em F G", H.alberti),
    hC: chords("Am F C G", H.pad2),
    bI: bass("C C G G", B.root8),
    bA1: bass("C G Am F", B.oct8),
    bA2: bass("C G F G", B.oct8),
    bB1: bass("F G Em Am", B.gallop),
    bB2: bass("Dm Em F G", B.gallop),
    bC: bass("Am F C G", B.half),
    bC2: bass("Am F C G", B.walk),
  },
  order: [
    sec("intro", "intro", "hI", "bI", "dHalf dHalf d8 f1"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dC d8 d8 d8b d8 d8 d8 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dC d8b d8 d8b d8 d8b d8 f2"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f1"),
    sec("breakdown", "c1", "hC", "bC", "dHalf*3 d8"),
    sec("breakdown echo", "c1", "~echo", "bC2", "dHalf*2 d8 f3"),
    sec("A up a tone", "a1 a2", "~echo", "bA1 bA2", "dC d8 d8 d8b d8 d8 d8 f3", 2),
  ],
};

// ─── CARD: memory card, cozy, F major ─────────────────────────────────────
const card: Song = {
  title: "Save Room",
  bpm: 92, stepsPerBeat: 4, key: "F major", loop: 1,
  mix: { lead: t("pulse50", 0.1, { vibrato: 15, sustain: 0.6 }), harm: t("pulse25", 0.045, { detune: 6, sustain: 0.5 }), bass: t("triangle", 0.2, { gate: 0.9 }), drums: 0.45 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("A5*6 G5*2 F5*4 C5*4 | D5*8 F5*4 A5*4 | Bb5*6 A5*2 G5*4 F5*4 | G5*12 -*4"),
    a2: line("A5*6 C6*2 A5*4 F5*4 | A5*4 G5*4 F5*4 E5*4 | D5*6 F5*2 Bb5*4 A5*2 G5*2 | F5*12 -*4"),
    b1: line("D6*4 C6*4 Bb5*4 A5*4 | G5*6 A5*2 C6*8 | C6*4 A5*4 E5*4 A5*4 | F5*8 D5*8"),
    b2: line("Bb4*4 D5*4 G5*6 F5*2 | E5*4 G5*4 C6*8 | A5*6 G5*2 F5*4 A5*4 | C6*12 -*4"),
    c1: line("F5*8 Bb5*8 | Db6*8 C6*4 Bb5*4 | A5*16 | -*16"),
    hI: chords("F C", H.slow),
    hA1: chords("F Dm Bb C", H.slow),
    hA2: chords("Am Dm Gm C,F", H.slow),
    hB1: chords("Bb C Am Dm", H.alberti),
    hB2: chords("Gm C F F", H.alberti),
    hC: chords("Bb Bbm F F", H.pad),
    bI: bass("F C", B.whole),
    bA1: bass("F Dm Bb C", B.walk),
    bA2: bass("Am Dm Gm C,F", "1*4 5*4 1*4 5*4"),
    bB1: bass("Bb C Am Dm", "1*6 5*2 8*4 5*4"),
    bB2: bass("Gm C F F", "1*6 5*2 8*4 5*4"),
    bC: bass("Bb Bbm F F", B.whole),
  },
  order: [
    sec("intro", "r2", "hI", "bI", "dE dE"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dCozy*3 dCozy2 dCozy*3 dCozy2"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dCozy*3 dCozy2 dCozy*3 fSoft"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dCozy*3 dCozy2 dCozy*2 dCozy2 fSoft"),
    sec("music box", "c1", "hC", "bC", "dE*4"),
    sec("A echo", "a2", "~echo", "bA2", "dCozy*3 fSoft"),
  ],
};

// ─── GALAXY: planet select, D lydian, spacey ──────────────────────────────
const galaxy: Song = {
  title: "Star Chart",
  bpm: 84, stepsPerBeat: 4, key: "D major", loop: 1,
  mix: { lead: t("pulse12", 0.1, { vibrato: 20, sustain: 0.7 }), harm: t("pulse25", 0.04, { gate: 0.6 }), bass: t("triangle", 0.2), drums: 0.4 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("F#5*4 A5*4 E6*8 | D6*6 C#6*2 B5*8 | F#5*4 A5*4 G#5*4 A5*4 | B5*16"),
    a2: line("B5*4 D6*4 F#6*8 | E6*6 D6*2 C#6*8 | A5*4 C#6*4 F#5*4 A5*4 | B5*12 -*4"),
    b1: line("G5*2 B5*2 E6*4 D6*2 B5*2 G5*4 | A5*2 C#6*2 F#6*4 E6*2 C#6*2 A5*4 | B5*2 D6*2 G6*4 F#6*4 D6*4 | E6*8 C#6*8"),
    c1: line("D6*16 | B5*16 | A5*8 F#5*8 | E5*16"),
    hI: chords("D E", H.sparkle),
    hA1: chords("D E D E", H.sparkle),
    hA2: chords("G A F#m Bm", H.sparkle),
    hB: chords("Em F#m G A", H.sparkle),
    hC: chords("Bm G D A", H.pad),
    bI: bass("D E", B.whole),
    bA1: bass("D E D E", "1*12 5*4"),
    bA2: bass("G A F#m Bm", "1*12 5*4"),
    bB: bass("Em F#m G A", "1*6 5*2 8*8"),
    bC: bass("Bm G D A", B.whole),
  },
  order: [
    sec("intro", "r2", "hI", "bI", "dE dE"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dSpace*4 dSpace2*3 dSpace"),
    sec("A echo", "a1 a2", "~echo", "bA1 bA2", "dSpace2*8"),
    sec("B", "b1", "hB", "bB", "dSpace2*3 dSpace"),
    sec("B lift", "b1", "hB", "bB", "dSpace2*4", 2),
    sec("drift", "c1", "hC", "bC", "dE*4"),
    sec("A return", "a2", "~3", "bA2", "dSpace*4"),
  ],
};

// ─── MAP (default): adventurous overworld, G major ────────────────────────
const mapDefault: Song = {
  title: "Open Road",
  bpm: 128, stepsPerBeat: 4, key: "G major", loop: 1,
  mix: { lead: t("pulse25", 0.12, { vibrato: 10 }), harm: t("pulse50", 0.05), bass: t("triangle", 0.22), drums: 0.8 },
  patterns: {
    ...KIT, ...RESTS,
    intro: line("-*8 D5*2 E5*2 F#5*2 G5*2 | A5*4 B5*4 C6*4 D6*4"),
    a1: line("D5*4 G5*3 A5 B5*4 G5*4 | C6*4 B5*2 A5*2 G5*4 E5*4 | F#5*4 A5*2 D6*2 C6*4 A5*4 | B5*12 -*2 D5*2"),
    a2: line("E5*4 G5*3 B5 E6*4 D6*4 | C6*2 B5*2 A5*2 G5*2 E5*4 G5*4 | A5*4 C#6*2 E6*2 G6*4 E6*4 | F#6*8 E6*4 D6*4"),
    b1: line("E6*2 D6*2 C6*4 G5*8 | F#5*2 G5*2 A5*4 D5*8 | B5*2 A5*2 F#5*4 D5*4 F#5*4 | E5*12 -*4"),
    b2: line("C6*2 B5*2 A5*4 E5*4 A5*4 | F#5*4 A5*4 D6*4 C6*4 | B5*2 C6*2 D6*4 G5*4 B5*4 | G5*12 -*4"),
    c1: line("B4*2 E5*2 G5*2 B5*2 A5*4 G5*4 | F#5*2 A5*2 D6*2 C6*2 B5*4 A5*4 | G5*2 E5*2 C5*2 E5*2 G5*4 C6*4 | B5*4 A5*4 F#5*4 D#5*4"),
    hI: chords("G D", H.pad),
    hA1: chords("G C D G", H.stab),
    hA2: chords("Em C A7 D", H.stab),
    hB1: chords("C D Bm Em", H.broken),
    hB2: chords("Am D G G", H.broken),
    hC: chords("Em D C B7", "C*4 -*2 C*2 -*2 C*2 C*4"),
    bI: bass("G D", B.oct8),
    bA1: bass("G C D G", B.disco),
    bA2: bass("Em C A7 D", B.disco),
    bB1: bass("C D Bm Em", B.sync),
    bB2: bass("Am D G G", B.sync),
    bC: bass("Em D C B7", B.gallop),
  },
  order: [
    sec("intro", "intro", "hI", "bI", "d8 f1"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dC d8 d8 d8b d8 d8 d8 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dC d8b d8 d8b d8 d8b d8 f2"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f1"),
    sec("C", "c1", "hC", "bC", "dC d16 d8b f3"),
    sec("C up", "c1", "~echo", "bC", "dC d16 d16 f3", 2),
    sec("B echo", "b1 b2", "~echo", "bB1 bB2", "dC d8b d8 d8b d8 d8b d8 f2"),
  ],
};

// ─── MAP rust: the forge, D minor with a hopeful F major middle ───────────
const mapRust: Song = {
  title: "Forge of Oxide",
  bpm: 120, stepsPerBeat: 4, key: "D minor", loop: 1,
  mix: { lead: t("pulse12", 0.12, { vibrato: 8 }), harm: t("pulse25", 0.05, { detune: 8, gate: 0.8 }), bass: t("triangle", 0.24, { gate: 0.7 }), drums: 0.9 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("D5*3 D5 F5*2 A5*2 G5*4 F5*2 E5*2 | D5*6 C5*2 D5*8 | F5*3 F5 G5*2 A5*2 Bb5*4 A5*2 G5*2 | E5*12 -*4"),
    a2: line("D5*3 D5 F5*2 A5*2 D6*4 C6*2 A5*2 | C6*4 A5*4 F5*4 D5*4 | G5*4 Bb5*4 D6*4 Bb5*4 | A5*8 /C#6*8"),
    b1: line("C6*6 A5*2 F5*8 | E5*4 G5*4 C6*8 | D6*6 C6*2 Bb5*4 A5*4 | A5*8 F5*8"),
    b2: line("Bb5*4 A5*4 G5*4 D5*4 | F5*4 Bb5*4 D6*8 | E6*6 D6*2 C6*4 G5*4 | C6*12 -*4"),
    c1: line("D6 -*3 D6 -*3 A5 - C6*2 -*4 | D6 -*3 D6 -*3 F6*2 E6*2 D6*4 | Bb5 -*3 Bb5 -*3 F5 - A5*2 -*4 | A5 -*3 C#6 -*3 E6*8"),
    hA1: chords("Dm Dm Bb C", H.broken),
    hA2: chords("Dm Dm Gm A", H.broken),
    hB1: chords("F C Bb F", "C*4 -*4 C*4 -*4"),
    hB2: chords("Gm Bb C C", "C*4 -*4 C*4 -*4"),
    hC: chords("Dm Dm Bb A", "c*2 -*6 c*2 -*6"),
    bA1: bass("Dm Dm Bb C", B.pump),
    bA2: bass("Dm Dm Gm A", B.pump),
    bB1: bass("F C Bb F", B.oct8),
    bB2: bass("Gm Bb C C", B.oct8),
    bC: bass("Dm Dm Bb A", B.pump),
  },
  order: [
    sec("intro", "r4", "r4", "bC", "dAnvil dAnvil dMetal fMetal"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dMetal*3 dMetal2 dMetal*3 fMetal"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dMetal2*3 dMetal dMetal2*3 fMetal"),
    sec("B (hope)", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f1"),
    sec("anvil", "c1", "hC", "bC", "dAnvil*2 dMetal fMetal"),
    sec("anvil echo", "c1", "~echo", "bC", "dMetal*3 fMetal"),
    sec("B up a tone", "b1 b2", "~3", "bB1 bB2", "dC d8b d8 d8b d8 d8b d8 f3", 2),
  ],
};

// ─── MAP typescript: bright techy A major ─────────────────────────────────
const mapTypescript: Song = {
  title: "Type Highway",
  bpm: 140, stepsPerBeat: 4, key: "A major", loop: 1,
  mix: { lead: t("pulse25", 0.12, { gate: 0.85, vibrato: 6 }), harm: t("pulse12", 0.05, { gate: 0.7 }), bass: t("triangle", 0.22, { gate: 0.85 }), drums: 0.85 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("E5*2 A5*2 - C#6*2 E6*3 D6*2 C#6*2 B5*2 | B5*3 G#5*3 E5*2 -*2 E5*2 G#5*2 B5*2 | C#6*3 A5*3 F#5*2 -*2 C#6*2 E6*2 F#6*2 | D6*6 C#6*2 A5*8"),
    a2: line("E5*2 A5*2 - C#6*2 E6*3 F#6*2 E6*2 C#6*2 | B5*3 E6*3 G#6*2 -*2 F#6*2 E6*2 D#6*2 | F#6*3 E6*3 D6*2 -*2 A5*2 B5*2 C#6*2 | B5*12 -*4"),
    b1: line("F#5*4 A5*2 C#6*2 F#6*4 E6*4 | D6*2 C#6*2 A5*4 F#5*4 A5*4 | E5*2 A5*2 C#6*2 E6*2 A6*8 | G#6*4 F#6*4 E6*8"),
    b2: line("D6*2 F#6*2 D6*2 B5*2 F#5*4 B5*4 | A5*2 F#5*2 D5*2 F#5*2 A5*4 D6*4 | E6*6 D6*2 B5*4 G#5*4 | E5*8 -*8"),
    c1: line("A5 C#6 E6 A6 E6 C#6 A5 C#6 E6 A6 E6 C#6 A5 E6 C#6 A5 | G#5 B5 E6 G#6 E6 B5 G#5 B5 E6 G#6 E6 B5 G#5 E6 B5 G#5 | F#5 A5 C#6 F#6 C#6 A5 F#5 A5 C#6 F#6 C#6 A5 F#5 C#6 A5 F#5 | F#5 A5 D6 F#6 A6*4 F#6*2 D6*2 A5*4"),
    hI: chords("A E", H.up16),
    hA1: chords("A E F#m D", H.up16),
    hA2: chords("A E D E", H.up16),
    hB1: chords("F#m D A E", H.stab),
    hB2: chords("Bm D E E", H.stab),
    hC: chords("A E F#m D", "C*2 -*2 C*2 -*2 C*2 -*2 C*2 C*2"),
    bI: bass("A E", B.disco),
    bA1: bass("A E F#m D", B.disco),
    bA2: bass("A E D E", B.disco),
    bB1: bass("F#m D A E", B.sync),
    bB2: bass("Bm D E E", B.sync),
    bC: bass("A E F#m D", B.pump),
  },
  order: [
    sec("intro", "r2", "hI", "bI", "dFour f1"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dC dFour*2 dTech dFour*3 f1"),
    sec("A echo", "a1 a2", "~echo", "bA1 bA2", "dTech*3 f2 dTech*3 f1"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f3"),
    sec("compile run", "c1", "hC", "bC", "dFour*3 f1"),
    sec("compile run up", "c1", "hC", "bC", "dTech*3 f3", 2),
    sec("A in C", "a1 a2", "~3", "bA1 bA2", "dC dTech*2 dFour dTech*3 f2", 3),
  ],
};

// ─── LESSON A: light battle groove, E minor ───────────────────────────────
const lessonA: Song = {
  title: "Bug Hunt",
  bpm: 136, stepsPerBeat: 4, key: "E minor", loop: 1,
  mix: { lead: t("pulse50", 0.1, { vibrato: 10, gate: 0.85 }), harm: t("pulse25", 0.05, { gate: 0.7 }), bass: t("triangle", 0.22, { gate: 0.85 }), drums: 0.75 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("E5*2 -*2 E5*2 G5*2 B5*4 A5*2 G5*2 | E5*2 -*2 E5*2 G5*2 C6*4 B5*2 A5*2 | F#5*2 -*2 F#5*2 A5*2 D6*4 C6*2 A5*2 | B5*8 D#5*8"),
    a2: line("E5*2 -*2 E5*2 G5*2 B5*4 E6*4 | C6*2 B5*2 G5*2 E5*2 C5*4 G5*4 | A5*2 B5*2 C6*2 E6*2 D6*2 C6*2 B5*2 A5*2 | B5*12 -*4"),
    b1: line("G5*4 E5*2 G5*2 C6*8 | A5*4 F#5*2 A5*2 D6*8 | B5*2 A5*2 F#5*2 D5*2 F#5*4 B5*4 | G5*6 F#5*2 E5*8"),
    b2: line("C6*4 A5*2 C6*2 E6*8 | D6*2 C6*2 A5*2 F#5*2 D5*4 F#5*4 | G5*2 A5*2 B5*2 D6*2 G6*8 | F#6*8 D#6*8"),
    c1: line("A5 - C6 - E6*2 C6*2 A5 - C6 - E6*4 | G5 - B5 - E6*2 B5*2 G5 - B5 - E6*4 | A5 - C6 - E6*2 C6*2 A6*4 G6*4 | F#6*4 D#6*4 B5*8"),
    hA1: chords("Em C D B7", H.stab),
    hA2: chords("Em C Am B", H.stab),
    hB1: chords("C D Bm Em", H.broken),
    hB2: chords("Am D G B7", H.broken),
    hC: chords("Am Em Am B", "C*2 -*6 C*2 -*6"),
    bI: bass("Em B7", B.oct8),
    bA1: bass("Em C D B7", B.oct8),
    bA2: bass("Em C Am B", B.oct8),
    bB1: bass("C D Bm Em", B.sync),
    bB2: bass("Am D G B7", B.sync),
    bC: bass("Am Em Am B", "1*2 -*6 1*2 -*6"),
    bC2: bass("Am Em Am B", B.oct8),
  },
  order: [
    sec("intro", "r2", "r2", "bI", "d8 f1"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dC d8 d8 d8b d8 d8 d8 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dC d8b d8 d8b d8 d8b d8 f2"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f1"),
    sec("breakdown", "c1", "hC", "bC", "dHalf*3 f3"),
    sec("breakdown echo", "c1", "~echo", "bC2", "d8*3 f1"),
  ],
};

// ─── LESSON B: bouncy handheld groove, A dorian ───────────────────────────
const lessonB: Song = {
  title: "Pocket Duel",
  bpm: 144, stepsPerBeat: 4, key: "A minor", loop: 1,
  mix: { lead: t("pulse25", 0.11, { vibrato: 8, gate: 0.85 }), harm: t("pulse12", 0.05, { gate: 0.6 }), bass: t("triangle", 0.22, { gate: 0.8 }), drums: 0.75 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("A5*3 C6*3 A5*2 D6*4 C6*2 A5*2 | G5*3 A5*3 F#5*2 D5*8 | A5*3 C6*3 A5*2 E6*4 D6*2 C6*2 | D6*3 E6*3 F#6*2 A6*8"),
    a2: line("F6*3 E6*3 C6*2 A5*4 C6*4 | D6*3 B5*3 G5*2 D6*8 | C6*2 B5*2 A5*2 E5*2 A5*2 B5*2 C6*2 E6*2 | G#5*8 B5*8"),
    b1: line("E6*4 G6*4 E6*2 D6*2 C6*4 | B5*4 D6*4 G5*8 | F5*2 A5*2 D6*2 F6*2 E6*4 D6*4 | C6*6 B5*2 A5*8"),
    b2: line("A5*4 C6*4 F6*4 E6*2 C6*2 | E6*4 D6*2 C6*2 G5*8 | G#5*2 B5*2 E6*2 G#6*2 B6*4 G#6*4 | E6*12 -*4"),
    hI: chords("Am D", H.roll),
    hA1: chords("Am D Am D", H.roll),
    hA2: chords("F G Am E", H.roll),
    hB1: chords("C G Dm Am", H.stab),
    hB2: chords("F C E E", H.stab),
    bI: bass("Am D", B.gallop),
    bA1: bass("Am D Am D", B.gallop),
    bA2: bass("F G Am E", B.gallop),
    bB1: bass("C G Dm Am", B.oct8),
    bB2: bass("F C E E", B.oct8),
  },
  order: [
    sec("intro", "r2", "hI", "bI", "dGB f1"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dGB*3 dGB2 dGB*3 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dGB2*3 dGB dGB2*3 f2"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f3"),
    sec("A in C", "a1 a2", "~echo", "bA1 bA2", "dC dGB*2 dGB2 dGB*3 f1", 3),
    sec("B in C", "b1 b2", "hB1 hB2", "bB1 bB2", "dC d8 d8 d8b d8 d8 d8b f3", 3),
  ],
};

// ─── BOSS: intense, driving, C minor ──────────────────────────────────────
const boss: Song = {
  title: "Segfault Titan",
  bpm: 168, stepsPerBeat: 4, key: "C minor", loop: 1,
  mix: { lead: t("pulse25", 0.12, { vibrato: 10 }), harm: t("pulse12", 0.06, { detune: 10, gate: 0.8 }), bass: t("triangle", 0.25, { gate: 0.8 }), drums: 1 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("C5*2 C5 C5 Eb5*2 G5*2 F#5*2 G5*2 C6*4 | Bb5*2 G5*2 Eb5*2 G5*2 F5*8 | Eb5*2 Eb5 Eb5 Ab5*2 C6*2 Bb5*2 Ab5*2 G5*4 | F5*2 G5*2 Ab5*2 Bb5*2 D6*8"),
    a2: line("C6*2 C6 C6 Bb5*2 G5*2 Eb6*4 D6*4 | C6*2 G5*2 Eb5*2 G5*2 C6*8 | Db6*4 C6*2 Ab5*2 F5*4 Ab5*4 | G5*4 B5*4 D6*4 F6*4"),
    b1: line("Eb6*6 C6*2 Ab5*8 | F6*6 D6*2 Bb5*8 | G5*2 Bb5*2 D6*2 G6*2 F6*4 D6*4 | Eb6*12 -*4"),
    b2: line("F5*2 Ab5*2 C6*2 F6*2 Eb6*4 C6*4 | D6*2 Bb5*2 F5*2 Bb5*2 D6*8 | Eb6*2 D6*2 Eb6*2 G6*2 Bb6*8 | B5*4 D6*4 F6*4 G6*4"),
    c1: line("C6 B5 C6 G5 C6 B5 C6 Eb6 C6 B5 C6 G5 Ab5*4 | C6 B5 C6 G5 C6 B5 C6 Eb6 C6 B5 C6 G5 Bb5*4 | C6 B5 C6 G5 C6 B5 C6 Eb6 C6 B5 C6 G5 B5*4 | D6*4 F6*4 Ab6*4 B6*4"),
    hA1: chords("Cm Cm Ab Bb", H.broken),
    hA2: chords("Cm Cm Db G", H.broken),
    hB1: chords("Ab Bb Gm Cm", H.stab),
    hB2: chords("Fm Bb Eb G", H.stab),
    hC: chords("Cm Cm Cm G", "C*2 -*2 C*2 -*2 C*2 -*2 C*2 C*2"),
    bI: bass("Cm Cm", B.pump),
    bA1: bass("Cm Cm Ab Bb", B.pump),
    bA2: bass("Cm Cm Db G", B.pump),
    bB1: bass("Ab Bb Gm Cm", B.oct8),
    bB2: bass("Fm Bb Eb G", B.oct8),
    bC: bass("Cm Cm Cm G", B.pump),
  },
  order: [
    sec("intro", "r2", "r2", "bI", "d16 fBoss"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dC dBoss*3 d16*3 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dC d16*3 dBoss*3 fBoss"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dC dBoss d16 dBoss d16 dBoss d16 f3"),
    sec("ostinato", "c1", "hC", "bC", "dHalf*3 f1"),
    sec("ostinato up", "c1", "~echo", "bC", "d16*3 fBoss", 1),
    sec("A up a tone", "a1 a2", "hA1 hA2", "bA1 bA2", "dC dBoss*3 d16*3 fBoss", 2),
  ],
};

// ─── EXAM: tense, concentrated, D minor with a clock-like pulse ───────────
const exam: Song = {
  title: "Proctor's Clock",
  bpm: 112, stepsPerBeat: 4, key: "D minor", loop: 1,
  mix: { lead: t("pulse12", 0.09, { vibrato: 14, sustain: 0.7 }), harm: t("pulse50", 0.035, { gate: 0.5 }), bass: t("triangle", 0.2, { gate: 0.6 }), drums: 0.5 },
  patterns: {
    ...KIT, ...RESTS,
    a1: line("A5*8 F5*4 D5*4 | E5*4 F5*4 A5*8 | Bb5*8 A5*4 F5*4 | E5*16"),
    a2: line("D6*8 C6*4 A5*4 | F5*4 A5*4 D6*8 | Eb6*8 D6*4 Bb5*4 | C#6*12 -*4"),
    b1: line("C6*6 A5*2 F5*8 | G5*6 E5*2 C5*8 | D5*4 G5*4 Bb5*4 D6*4 | C#6*8 A5*8"),
    b2: line("D6*6 Bb5*2 F5*8 | A5*6 F5*2 C6*8 | Bb5*4 G5*4 D5*4 G5*4 | A5*4 C#6*4 E6*8"),
    c1: line("D6*2 -*14 | A5*2 -*6 F5*2 -*6 | D6*2 -*14 | E6*2 -*6 C#6*2 -*6"),
    hA1: chords("Dm Dm Bb A", "1*2 -*2 5*2 -*2 8*2 -*2 5*2 -*2"),
    hA2: chords("Gm Dm Eb A", "1*2 -*2 5*2 -*2 8*2 -*2 5*2 -*2"),
    hB1: chords("F C Gm A", H.pad2),
    hB2: chords("Bb F Gm A", H.pad2),
    hC: chords("Dm Dm Dm A", "-*12 c*4"),
    bI: bass("Dm Dm", B.tick),
    bA1: bass("Dm Dm Bb A", B.root8),
    bA2: bass("Gm Dm Eb A", B.root8),
    bB1: bass("F C Gm A", B.root8),
    bB2: bass("Bb F Gm A", B.root8),
    bC: bass("Dm Dm Dm A", B.tick),
  },
  order: [
    sec("intro", "r2", "r2", "bI", "dTick dTick"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dTick*3 dTick2 dTick*3 dTick2"),
    sec("B", "b1 b2", "hB1 hB2", "bB1 bB2", "dTick2*7 f1"),
    sec("A harmony", "a1 a2", "~3", "bA1 bA2", "dTick*3 dTick2 dTick*3 fSoft"),
    sec("held breath", "c1", "hC", "bC", "dTick*4"),
    sec("held breath up", "c1", "~echo", "bC", "dTick*3 dTick2", 1),
  ],
};

// ─── RESULT: calm victory, D major ────────────────────────────────────────
const result: Song = {
  title: "Stage Clear",
  bpm: 120, stepsPerBeat: 4, key: "D major", loop: 1,
  mix: { lead: t("pulse50", 0.1, { vibrato: 12, sustain: 0.6 }), harm: t("pulse25", 0.045), bass: t("triangle", 0.2, { gate: 0.9 }), drums: 0.55 },
  patterns: {
    ...KIT, ...RESTS,
    intro: line("D5*2 D5*2 F#5*2 A5*2 D6*8"),
    a1: line("F#5*2 A5*2 D6*4 C#6*2 B5*2 A5*4 | B5*4 G5*4 D5*4 G5*4 | A5*2 C#6*2 E6*4 D6*2 C#6*2 A5*4 | D6*12 -*4"),
    a2: line("B5*4 D6*4 F#6*4 D6*4 | B5*2 D6*2 G6*4 F#6*4 D6*4 | E6*4 D6*4 B5*4 G#5*4 | A5*8 C#6*8"),
    b1: line("D6*6 B5*2 G5*8 | E6*6 C#6*2 A5*8 | F#6*4 E6*4 C#6*4 A5*4 | B5*12 -*4"),
    hI: chords("D", H.pad),
    hA1: chords("D G A D", H.broken),
    hA2: chords("Bm G E7 A", H.broken),
    bI: bass("D", B.whole),
    bA1: bass("D G A D", B.walk),
    bA2: bass("Bm G E7 A", B.walk),
    hB: chords("G A F#m Bm", H.alberti),
    bB: bass("G A F#m Bm", "1*6 5*2 8*4 5*4"),
    dFan: drums("c.......s.s.ssss"),
  },
  order: [
    sec("fanfare", "intro", "hI", "bI", "dFan"),
    sec("A", "a1 a2", "hA1 hA2", "bA1 bA2", "dCozy*3 dCozy2 dCozy*3 fSoft"),
    sec("B", "b1", "hB", "bB", "dCozy2*3 fSoft"),
    sec("A echo", "a2", "~echo", "bA2", "dCozy2*3 fSoft"),
  ],
};

// ─── one-shot jingles ─────────────────────────────────────────────────────
const jingleClear: Song = {
  title: "Clear!",
  bpm: 150, stepsPerBeat: 4, key: "C major", loop: 0, oneShot: true,
  mix: { lead: t("pulse25", 0.13, { vibrato: 14 }), harm: t("pulse12", 0.06), bass: t("triangle", 0.22), drums: 0.8 },
  patterns: {
    ...KIT,
    j: line("C5*2 E5*2 G5*2 C6*2 E6*4 C6*2 E6*2 | G6*12 -*4"),
    b: bass("C C", ["1*2 5*2 8*2 5*2 1*4 5*4", "1*12 -*4"]),
    d: drums("c.s.s.s.s.s.ssss c..............."),
  },
  order: [sec("jingle", "j", "~3", "b", "d")],
};

const jingleGameOver: Song = {
  title: "Stack Overflow",
  bpm: 100, stepsPerBeat: 4, key: "C minor", loop: 0, oneShot: true,
  mix: { lead: t("pulse50", 0.11, { vibrato: 18 }), harm: t("pulse12", 0.05), bass: t("triangle", 0.2), drums: 0.5 },
  patterns: {
    ...KIT, ...RESTS,
    j: line("G5*4 F#5*4 F5*4 E5*4 | Eb5*4 D5*4 Db5*4 C5*4 | C5*12 -*4"),
    h: chords("Cm Ab Cm", ["-*16", "-*16", "c*12 -*4"]),
    b: bass("C Ab C", ["1*16", "1*16", "1*12 -*4"]),
  },
  order: [sec("jingle", "j", "h", "b", "dE*3")],
};

export const SONGS: Record<string, Song> = {
  title,
  card,
  galaxy,
  "map:default": mapDefault,
  "map:rust": mapRust,
  "map:typescript": mapTypescript,
  "lesson:a": lessonA,
  "lesson:b": lessonB,
  boss,
  exam,
  result,
  "jingle:clear": jingleClear,
  "jingle:gameover": jingleGameOver,
};

/** Names that pick one of several songs at random. */
export const VARIANTS: Record<string, string[]> = {
  lesson: ["lesson:a", "lesson:b"],
};

/** Song actually played for a requested name ("map:react" → "map:default"), or null. */
export function resolveSong(name: string, rand: () => number = Math.random): string | null {
  if (SONGS[name]) return name;
  const v = VARIANTS[name];
  if (v) return v[Math.floor(rand() * v.length) % v.length];
  if (name.startsWith("map:")) return "map:default";
  return null;
}
