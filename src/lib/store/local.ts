import type { Tournament } from "@/lib/types";
import type { TournamentStore } from "./types";

const KEY = "grandmaster:tournaments:v1";
const CHANNEL = "grandmaster:sync";

/**
 * Local, zero-config store. Persists to localStorage and broadcasts changes to
 * other open tabs via BroadcastChannel — so the bracket updates live across
 * every tab on this machine with no backend. Drop in Supabase keys for true
 * cross-device sync.
 */
export class LocalStore implements TournamentStore {
  readonly kind = "local" as const;
  private listeners = new Set<() => void>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = () => this.emit(false);
    }
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) this.emit(false);
    });
  }

  private read(): Tournament[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Tournament[]) : [];
    } catch {
      return [];
    }
  }

  private write(all: Tournament[]): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  }

  private emit(broadcast: boolean): void {
    if (broadcast) this.channel?.postMessage("changed");
    for (const l of this.listeners) l();
  }

  async list(): Promise<Tournament[]> {
    return this.read().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  async get(id: string): Promise<Tournament | null> {
    return this.read().find((t) => t.id === id) ?? null;
  }

  async save(t: Tournament): Promise<void> {
    const all = this.read();
    const idx = all.findIndex((x) => x.id === t.id);
    if (idx >= 0) all[idx] = t;
    else all.push(t);
    this.write(all);
    this.emit(true);
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((t) => t.id !== id));
    this.emit(true);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
