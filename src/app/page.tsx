"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Eye, Plus, Radio, Sparkles, Swords } from "lucide-react";
import { TournamentCard } from "@/components/TournamentCard";
import { useTournaments } from "@/lib/store";
import { seedDemoIfEmpty } from "@/lib/store/seed";

export default function HomePage() {
  const { data, loading } = useTournaments();

  useEffect(() => {
    seedDemoIfEmpty();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="panel board-texture relative overflow-hidden p-8 sm:p-12">
        <div className="bg-ink-fade pointer-events-none absolute inset-0" />
        <div className="relative max-w-2xl">
          <span className="chip mb-4 text-gold-200">
            <Sparkles className="h-3.5 w-3.5" /> Built on the Chess.com API
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-cream sm:text-5xl">
            Run the tournament.<br />
            <span className="text-gradient-gold">Everyone watches it live.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Drop in your players, pick a format, and Grandmaster builds the bracket. One shared link
            shows who&apos;s playing whom, who has White, who&apos;s winning — and updates the moment
            you record a result.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/tournaments/new" className="btn-gold">
              <Plus className="h-4 w-4" /> Create a tournament
            </Link>
            <a href="#tournaments" className="btn-ghost">
              <Eye className="h-4 w-4" /> Browse live brackets
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="chip"><Swords className="h-3.5 w-3.5 text-gold-200" /> Round robin · Swiss · Single &amp; double elim</span>
            <span className="chip"><Radio className="h-3.5 w-3.5 text-live" /> Live clocks &amp; move counts</span>
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <section id="tournaments" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-cream">Tournaments</h2>
          <Link href="/tournaments/new" className="btn-subtle text-xs">
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="panel h-44 animate-pulse bg-ink-800/40" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="panel board-texture flex flex-col items-center justify-center gap-4 p-12 text-center">
            <Swords className="h-10 w-10 text-gold-300" />
            <div>
              <p className="font-display text-xl text-cream">No tournaments yet</p>
              <p className="mt-1 text-sm text-muted">Create your first one — it takes about a minute.</p>
            </div>
            <Link href="/tournaments/new" className="btn-gold">
              <Plus className="h-4 w-4" /> Create a tournament
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
