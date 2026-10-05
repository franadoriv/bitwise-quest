// WebAudio voices and a song player driven by a lookahead scheduler.
// The player only schedules notes on AudioContext time; the caller decides when to call
// `scheduleUntil` (a 25 ms timer live, once for an OfflineAudioContext render).
import { mtof, type CompiledSong, type NoteEv, type Timbre } from "./dsl.ts";

// ─── waveforms ────────────────────────────────────────────────────────────
const waveCache = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();
/** Band-limited pulse wave with the given duty cycle (NES: 12.5%, 25%, 50%). */
function pulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  let m = waveCache.get(ctx);
  if (!m) waveCache.set(ctx, (m = new Map()));
  const key = `p${duty}`;
  let w = m.get(key);
  if (!w) {
    const n = 48;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      real[k] = (2 / (k * Math.PI)) * Math.sin(2 * Math.PI * k * duty);
      imag[k] = (2 / (k * Math.PI)) * (1 - Math.cos(2 * Math.PI * k * duty));
    }
    w = ctx.createPeriodicWave(real, imag);
    m.set(key, w);
  }
  return w;
}
function setWave(ctx: BaseAudioContext, o: OscillatorNode, wave: Timbre["wave"]) {
  if (wave === "triangle") o.type = "triangle";
  else o.setPeriodicWave(pulseWave(ctx, wave === "pulse12" ? 0.125 : wave === "pulse25" ? 0.25 : 0.5));
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
/** One second of "LFSR-ish" noise: white noise held for a couple of samples, a bit grittier. */
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let b = noiseCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    let v = 0;
    for (let i = 0; i < d.length; i++) {
      if (i % 2 === 0) v = Math.random() * 2 - 1;
      d[i] = v;
    }
    noiseCache.set(ctx, b);
  }
  return b;
}

// ─── voices ───────────────────────────────────────────────────────────────
const ARP_RATE = 1 / 32; // seconds per arpeggio note

function playNote(ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, ev: NoteEv, tm: Timbre, prev: number | null) {
  const o = ctx.createOscillator();
  setWave(ctx, o, tm.wave);
  const f = mtof(ev.midi);
  const gate = Math.max(0.03, dur * (tm.gate ?? (tm.wave === "triangle" ? 0.95 : 0.92)));
  if (ev.slide && prev != null) {
    o.frequency.setValueAtTime(mtof(prev), t);
    o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.09, gate * 0.5));
  } else {
    o.frequency.setValueAtTime(f, t);
  }
  if (ev.arp && ev.arp.length > 1) {
    let k = 0;
    for (let tt = t; tt < t + gate && k < 256; tt += ARP_RATE, k++) o.frequency.setValueAtTime(mtof(ev.midi + ev.arp[k % ev.arp.length]), tt);
  }
  if (tm.detune) o.detune.setValueAtTime(tm.detune, t);
  const nodes: AudioScheduledSourceNode[] = [o];
  if (tm.vibrato && gate > 0.3 && !ev.arp) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, t);
    depth.gain.setValueAtTime(0, t + 0.18);
    depth.gain.linearRampToValueAtTime(tm.vibrato, t + 0.4);
    lfo.connect(depth).connect(o.detune);
    nodes.push(lfo);
  }
  const g = ctx.createGain();
  const v = tm.vol;
  const sus = tm.sustain ?? (tm.wave === "triangle" ? 1 : 0.75);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.006);
  if (sus < 1) g.gain.setTargetAtTime(v * sus, t + 0.006, 0.12);
  g.gain.setTargetAtTime(0, t + gate, 0.012);
  o.connect(g).connect(out);
  for (const n of nodes) { n.start(t); n.stop(t + gate + 0.08); }
}

function noiseHit(ctx: BaseAudioContext, out: AudioNode, t: number, vol: number, len: number, filter: BiquadFilterType, freq: number, q = 0.7) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const bq = ctx.createBiquadFilter();
  bq.type = filter;
  bq.frequency.value = freq;
  bq.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  src.connect(bq).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.02);
}
function sweep(ctx: BaseAudioContext, out: AudioNode, t: number, vol: number, from: number, to: number, len: number, type: OscillatorType = "triangle") {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + len * 0.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.02);
}

export function playDrum(ctx: BaseAudioContext, out: AudioNode, t: number, d: string, vol: number) {
  switch (d) {
    case "k": sweep(ctx, out, t, 0.42 * vol, 150, 42, 0.16); noiseHit(ctx, out, t, 0.08 * vol, 0.012, "lowpass", 3000); break;
    case "s": noiseHit(ctx, out, t, 0.22 * vol, 0.13, "bandpass", 1900, 0.6); sweep(ctx, out, t, 0.12 * vol, 220, 160, 0.06); break;
    case "x": playDrum(ctx, out, t, "k", vol); playDrum(ctx, out, t, "s", vol); break;
    case "h": noiseHit(ctx, out, t, 0.07 * vol, 0.035, "highpass", 7500); break;
    case "o": noiseHit(ctx, out, t, 0.06 * vol, 0.16, "highpass", 6500); break;
    case "c": playDrum(ctx, out, t, "k", vol); noiseHit(ctx, out, t, 0.1 * vol, 0.7, "highpass", 4500); break;
    case "m": noiseHit(ctx, out, t, 0.1 * vol, 0.07, "bandpass", 3300, 9); sweep(ctx, out, t, 0.03 * vol, 1250, 1180, 0.05, "square"); break;
    case "T": sweep(ctx, out, t, 0.3 * vol, 260, 140, 0.14); break;
    case "t": sweep(ctx, out, t, 0.32 * vol, 170, 85, 0.16); break;
  }
}

// ─── player ───────────────────────────────────────────────────────────────
export class SongPlayer {
  readonly bus: GainNode;
  section = 0;
  step = 0;
  nextTime: number;
  done = false;
  private prev = { lead: null as number | null, harm: null as number | null };

  constructor(readonly ctx: BaseAudioContext, dest: AudioNode, readonly song: CompiledSong, startAt = ctx.currentTime + 0.06, fadeIn = 0) {
    this.bus = ctx.createGain();
    if (fadeIn > 0) {
      this.bus.gain.setValueAtTime(0, startAt);
      this.bus.gain.linearRampToValueAtTime(1, startAt + fadeIn);
    }
    this.bus.connect(dest);
    this.nextTime = startAt;
  }

  /** Schedules every step that starts before `until` (AudioContext seconds). */
  scheduleUntil(until: number) {
    const { sections, stepDur, song } = this.song;
    while (!this.done && this.nextTime < until) {
      const sec = sections[this.section];
      const t = this.nextTime;
      const i = this.step;
      for (const ch of ["lead", "harm", "bass"] as const) {
        const ev = sec[ch][i];
        if (!ev) continue;
        playNote(this.ctx, this.bus, t, ev.len * stepDur, ev, song.mix[ch], ch === "bass" ? null : this.prev[ch as "lead" | "harm"]);
        if (ch !== "bass") this.prev[ch as "lead" | "harm"] = ev.midi;
      }
      const d = sec.drums[i];
      if (d) playDrum(this.ctx, this.bus, t, d, song.mix.drums);
      this.nextTime += stepDur;
      if (++this.step >= sec.len) {
        this.step = 0;
        if (++this.section >= sections.length) {
          if (song.oneShot) this.done = true;
          else this.section = song.loop;
        }
      }
    }
  }

  /** Skip ahead after a pause (hidden tab) without bursting the backlog. */
  resync(now: number) {
    if (this.nextTime < now + 0.05) this.nextTime = now + 0.05;
  }

  fadeOut(dur: number) {
    const now = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setValueAtTime(this.bus.gain.value, now);
    this.bus.gain.linearRampToValueAtTime(0, now + dur);
    this.done = true;
  }

  dispose() {
    try { this.bus.disconnect(); } catch {}
  }
}
