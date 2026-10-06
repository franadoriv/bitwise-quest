import { fingerprint, reconcile, type CloudRow, type Conflict, type Replica } from "./model.ts";
import { SLOT_COUNT, type SaveData } from "../save/schema.ts";

export interface LocalCard {
  read(slot: number): Promise<SaveData | null>;
  apply(slot: number, save: SaveData | null, expectedGeneration: number): Promise<boolean>;
  replica(slot: number): Replica;
  journal(slot: number, replica: Replica): void;
}
export interface CloudTransport {
  list(): Promise<CloudRow[]>;
  /** Atomic compare-and-swap. null means another device changed this slot. */
  write(slot: number, revision: number, data: SaveData | null): Promise<CloudRow | null>;
}

/** One sync at a time. No clock-based last-write-wins, no blind upserts, no polling. */
export class CardSync {
  private pending: Promise<Conflict[]> | null = null;
  private stopped = false;
  readonly conflicts = new Map<number, Conflict>();
  private local: LocalCard;
  private remote: CloudTransport;
  constructor(local: LocalCard, remote: CloudTransport) { this.local = local; this.remote = remote; }
  stop() { this.stopped = true; }
  run(pull = true): Promise<Conflict[]> {
    if (this.pending) return this.pending;
    this.pending = this.perform(pull).finally(() => { this.pending = null; });
    return this.pending;
  }
  private async perform(pull: boolean): Promise<Conflict[]> {
    const rows = pull ? await this.remote.list() : [];
    if (this.stopped) return [];
    const bySlot = new Map(rows.map((r) => [r.slot, r]));
    for (let slot = 1; slot <= SLOT_COUNT && !this.stopped; slot++) {
      if (this.conflicts.has(slot)) continue;
      const initial = this.local.replica(slot);
      const data = await this.local.read(slot);
      // A local write while we were reading will be handled by the next flush.
      if (this.local.replica(slot).generation !== initial.generation || this.stopped) continue;
      const remote = bySlot.get(slot) ?? { slot, revision: 0, data: null };
      // Another tab may have advanced the journal while this list request was in flight.
      if (pull && remote.revision < initial.revision) continue;
      const action = pull ? reconcile(data, initial, remote) : initial.dirty ? "push" : "same";
      if (action === "conflict") {
        this.conflicts.set(slot, { slot, local: data, remote });
      } else if (action === "pull") {
        const applied = await this.local.apply(slot, remote.data, initial.generation);
        if (this.stopped) return [];
        if (applied) this.local.journal(slot, { ...initial, revision: remote.revision, dirty: false });
      } else if (action === "same" && pull) {
        this.local.journal(slot, { ...initial, revision: remote.revision, dirty: false });
      } else if (action === "push") {
        const saved = await this.remote.write(slot, initial.revision, data);
        if (this.stopped) return [];
        const current = this.local.replica(slot);
        if (saved) {
          // Keep a newer local edit dirty, but advance its base to our successful write.
          this.local.journal(slot, { ...current, revision: saved.revision, dirty: current.generation !== initial.generation });
        } else {
          const latest = (await this.remote.list()).find((r) => r.slot === slot) ?? remote;
          if (this.stopped) return [];
          const local = await this.local.read(slot);
          if (fingerprint(local) === fingerprint(latest.data)) {
            this.local.journal(slot, { ...this.local.replica(slot), revision: latest.revision, dirty: false });
          } else this.conflicts.set(slot, { slot, local, remote: latest });
        }
      }
    }
    return [...this.conflicts.values()];
  }
  /** The player explicitly chooses a version. A concurrent remote change still cannot be overwritten. */
  async resolve(slot: number, choice: "local" | "remote") {
    if (this.pending) await this.pending;
    const conflict = this.conflicts.get(slot);
    if (!conflict || this.stopped) return;
    const replica = this.local.replica(slot);
    if (choice === "remote" && !await this.local.apply(slot, conflict.remote.data, replica.generation)) return;
    this.local.journal(slot, { ...replica, revision: conflict.remote.revision, dirty: choice === "local" });
    this.conflicts.delete(slot);
  }
}
