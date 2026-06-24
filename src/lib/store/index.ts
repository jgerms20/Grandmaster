"use client";

import { useEffect, useState } from "react";
import type { Tournament } from "@/lib/types";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import type { TournamentStore } from "./types";

let singleton: TournamentStore | null = null;

/** Lazily create the active store (Supabase if configured, else local). */
export function getStore(): TournamentStore {
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  singleton = url && key ? new SupabaseStore(url, key) : new LocalStore();
  return singleton;
}

export function storeKind(): "local" | "supabase" {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "supabase"
    : "local";
}

/** Persist a tournament (any backend) — this is what drives realtime updates. */
export async function commit(t: Tournament): Promise<void> {
  await getStore().save(t);
}

export async function removeTournament(id: string): Promise<void> {
  await getStore().remove(id);
}

/** Subscribe to the full tournament list with live updates. */
export function useTournaments(): { data: Tournament[] | null; loading: boolean } {
  const [data, setData] = useState<Tournament[] | null>(null);
  useEffect(() => {
    const store = getStore();
    let alive = true;
    const refresh = () => store.list().then((d) => alive && setData(d));
    refresh();
    const unsub = store.subscribe(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return { data, loading: data === null };
}

/** Subscribe to a single tournament with live updates. */
export function useTournament(id: string): { data: Tournament | null; loading: boolean } {
  const [data, setData] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const store = getStore();
    let alive = true;
    const refresh = () =>
      store.get(id).then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      });
    refresh();
    const unsub = store.subscribe(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, [id]);
  return { data, loading };
}
