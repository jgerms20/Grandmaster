import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Tournament } from "@/lib/types";
import type { TournamentStore } from "./types";

const TABLE = "tournaments";

/**
 * Supabase-backed store. The whole Tournament is persisted as a JSONB `data`
 * column; realtime postgres_changes on the table notify every connected client,
 * which then re-reads. Run supabase/schema.sql once to create the table.
 */
export class SupabaseStore implements TournamentStore {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;
  private listeners = new Set<() => void>();
  private channelStarted = false;

  constructor(url: string, anonKey: string) {
    this.db = createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 5 } } });
  }

  private ensureChannel(): void {
    if (this.channelStarted) return;
    this.channelStarted = true;
    this.db
      .channel("grandmaster:tournaments")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => {
        for (const l of this.listeners) l();
      })
      .subscribe();
  }

  async list(): Promise<Tournament[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select("data")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("[supabase] list", error.message);
      return [];
    }
    return (data ?? []).map((r) => r.data as Tournament);
  }

  async get(id: string): Promise<Tournament | null> {
    const { data, error } = await this.db.from(TABLE).select("data").eq("id", id).maybeSingle();
    if (error) {
      console.error("[supabase] get", error.message);
      return null;
    }
    return (data?.data as Tournament) ?? null;
  }

  async save(t: Tournament): Promise<void> {
    const { error } = await this.db
      .from(TABLE)
      .upsert({ id: t.id, data: t, updated_at: t.updatedAt }, { onConflict: "id" });
    if (error) console.error("[supabase] save", error.message);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from(TABLE).delete().eq("id", id);
    if (error) console.error("[supabase] remove", error.message);
  }

  subscribe(listener: () => void): () => void {
    this.ensureChannel();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
