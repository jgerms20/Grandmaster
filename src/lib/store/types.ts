import type { Tournament } from "@/lib/types";

/**
 * Storage + realtime contract. Two interchangeable implementations exist:
 *  - LocalStore   (browser localStorage + BroadcastChannel, zero config)
 *  - SupabaseStore (Postgres + realtime, cross-device)
 *
 * The UI only ever talks to this interface, so swapping backends is invisible.
 */
export interface TournamentStore {
  readonly kind: "local" | "supabase";
  list(): Promise<Tournament[]>;
  get(id: string): Promise<Tournament | null>;
  save(t: Tournament): Promise<void>;
  remove(id: string): Promise<void>;
  /** Fires whenever data changes (any device/tab). Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
}
