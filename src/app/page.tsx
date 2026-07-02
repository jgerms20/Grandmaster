"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Eye, Plus, Radio, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { TournamentCard } from "@/components/TournamentCard";
import { useTournaments } from "@/lib/store";
import { seedDemoIfEmpty } from "@/lib/store/seed";

const FLOATERS: Array<{ glyph: string; className: string; duration: string; delay: string }> = [
  { glyph: "♞", className: "right-[8%] top-6 text-[120px] sm:text-[168px]", duration: "9s", delay: "0s" },
  { glyph: "♜", className: "right-[26%] bottom-2 text-[72px] sm:text-[96px]", duration: "7s", delay: "-3s" },
  { glyph: "♛", className: "right-[2%] bottom-8 text-[56px] sm:text-[80px]", duration: "11s", delay: "-6s" },
];

export default function HomePage() {
  const { data, loading } = useTournaments();

  useEffect(() => {
    seedDemoIfEmpty();
  }, []);

  const liveNow = (data ?? []).reduce(
    (n, t) => n + t.matches.filter((m) => m.status === "live").length,
    0,
  );
  const playerCount = (data ?? []).reduce((n, t) => n + t.players.length, 0);
  const championCount = (data ?? []).filter((t) => t.championId).length;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="panel relative overflow-hidden p-8 sm:p-12">
        <div className="board-8 pointer-events-none absolute inset-0 [mask-image:linear-gradient(105deg,transparent_30%,black_75%)]" />
        <div className="bg-ink-fade pointer-events-none absolute inset-0" />
        {FLOATERS.map((f) => (
          <span
            key={f.glyph}
            aria-hidden
            className={`animate-float pointer-events-none absolute select-none leading-none text-cream/[0.07] ${f.className}`}
            style={{ animationDuration: f.duration, animationDelay: f.delay }}
          >
            {f.glyph}
          </span>
        ))}

        <div className="relative max-w-2xl">
          <span className="chip mb-4 text-gold-200">
            <Sparkles className="h-3.5 w-3.5" /> Built on the Chess.com API
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight text-cream sm:text-6xl">
            Run the tournament.
            <br />
            <span className="text-gradient-gold">Everyone watches it live.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Drop in your players, pick a format, and Grandmaster builds the bracket. One shared link
            shows who&apos;s playing whom, who has White, who&apos;s winning — synced straight from
            your Chess.com games.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/tournaments/new" className="btn-gold px-6 py-3 text-base">
              <Plus className="h-5 w-5" /> Create a tournament
            </Link>
            <a href="#tournaments" className="btn-ghost px-5 py-3">
              <Eye className="h-4 w-4" /> Browse brackets
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="chip">
              <Swords className="h-3.5 w-3.5 text-gold-200" /> Round robin · Swiss · Knockouts
            </span>
            <span className="chip">
              <Radio className="h-3.5 w-3.5 text-live" /> Live games, clocks &amp; move counts
            </span>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      {data && data.length > 0 && (
        <section className="grid grid-cols-3 gap-3">
          {(
            [
              { icon: Swords, label: "Tournaments", value: data.length },
              { icon: Users, label: "Players", value: playerCount },
              liveNow > 0
                ? { icon: Radio, label: "Live right now", value: liveNow, hot: true }
                : { icon: Trophy, label: "Champions crowned", value: championCount },
            ] as const
          ).map(({ icon: Icon, label, value, ...rest }, i) => (
            <div
              key={label}
              className="panel-flat animate-in flex items-center gap-3 px-4 py-3"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <Icon
                className={`h-5 w-5 ${"hot" in rest && rest.hot ? "animate-pulse-live text-live" : "text-gold-300"}`}
              />
              <div>
                <p className="font-display text-xl font-black leading-none text-cream">{value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Tournaments */}
      <section id="tournaments" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-cream">Tournaments</h2>
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
            {data.map((t, i) => (
              <div key={t.id} className="animate-in" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                <TournamentCard tournament={t} />
              </div>
            ))}
          </div>
        ) : (
          <div className="panel board-texture flex flex-col items-center justify-center gap-4 p-12 text-center">
            <Swords className="h-10 w-10 text-gold-300" />
            <div>
              <p className="font-display text-xl font-bold text-cream">No tournaments yet</p>
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
