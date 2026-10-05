// Binary save-file codec (".bwq"). Works in browsers and in Node (tests).
//
// Layout (little-endian):
//   0  u8[4]  magic "BWQ!"
//   4  u8     container version (CONTAINER)
//   5  u16    save version (SaveData.version)
//   7  u8     flags (bit 0: payload is deflate-raw compressed)
//   8  u32    seed (random per encode, so identical saves never produce identical files)
//  12  u32    payload length
//  16  u32    CRC32 of the clear payload
//  20  u8[]   payload, XOR-ed with an xorshift32 keystream derived from the seed
//
// This is OBFUSCATION, not encryption: it makes saves unreadable and tamper-evident at a glance
// (any edited byte fails the CRC), but anyone with the game's source can decode them.
import { SaveError, migrate } from "./migrate.ts";
import type { SaveData } from "./schema.ts";

const MAGIC = [0x42, 0x57, 0x51, 0x21]; // "BWQ!"
const CONTAINER = 1;
const HEADER = 20;
const KEY = 0x5eed_b17e;
const FLAG_DEFLATE = 1;

let crcTable: Uint32Array | null = null;
export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function xorStream(bytes: Uint8Array, seed: number): Uint8Array {
  const out = new Uint8Array(bytes.length);
  let x = (seed ^ KEY) >>> 0 || 1;
  for (let i = 0; i < bytes.length; i++) {
    if ((i & 3) === 0) {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5; x >>>= 0;
    }
    out[i] = bytes[i] ^ ((x >>> ((i & 3) * 8)) & 0xff);
  }
  return out;
}

const hasStreams = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeSave(save: SaveData): Promise<Uint8Array> {
  const json = new TextEncoder().encode(JSON.stringify(save));
  const compress = hasStreams();
  const body = compress ? await pipe(json, new CompressionStream("deflate-raw")) : json;
  const seed = (Math.random() * 0xffffffff) >>> 0;
  const out = new Uint8Array(HEADER + body.length);
  const view = new DataView(out.buffer);
  out.set(MAGIC, 0);
  view.setUint8(4, CONTAINER);
  view.setUint16(5, save.version, true);
  view.setUint8(7, compress ? FLAG_DEFLATE : 0);
  view.setUint32(8, seed, true);
  view.setUint32(12, body.length, true);
  view.setUint32(16, crc32(body), true);
  out.set(xorStream(body, seed), HEADER);
  return out;
}

export async function decodeSave(bytes: Uint8Array): Promise<SaveData> {
  if (bytes.length < HEADER || MAGIC.some((m, i) => bytes[i] !== m)) throw new SaveError("format", "Not a Bitwise Quest save file");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint8(4) > CONTAINER) throw new SaveError("newer", "Save file format is newer than this game");
  const flags = view.getUint8(7);
  const seed = view.getUint32(8, true);
  const len = view.getUint32(12, true);
  const crc = view.getUint32(16, true);
  if (HEADER + len !== bytes.length) throw new SaveError("corrupt", "Save file is truncated or padded");
  const body = xorStream(bytes.subarray(HEADER), seed);
  if (crc32(body) !== crc) throw new SaveError("checksum", "Save file was modified or damaged");
  let json: Uint8Array;
  try {
    json = flags & FLAG_DEFLATE ? await pipe(body, new DecompressionStream("deflate-raw")) : body;
  } catch {
    throw new SaveError("corrupt", "Save file payload cannot be decompressed");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(json));
  } catch {
    throw new SaveError("corrupt", "Save file payload is not valid");
  }
  return migrate(raw);
}

// localStorage only holds strings: the same binary, base64 encoded.
export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** "BitwiseQuest_<player>_<YYYY-MM-DD_HH-MM-SS>.bwq" in local time. */
export function exportFileName(save: SaveData, at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}_${p(at.getHours())}-${p(at.getMinutes())}-${p(at.getSeconds())}`;
  // Latin accents are folded (Ñandú → Nandu); other scripts (ゆうき, Алиса) are kept as is.
  const name = save.player.name.normalize("NFKD").replace(/([A-Za-z])\p{M}+/gu, "$1").normalize("NFC").replace(/[^\p{L}\p{N}_-]+/gu, "") || "Player";
  return `BitwiseQuest_${name}_${stamp}.bwq`;
}
