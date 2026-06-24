import Link from "next/link";
import { CalendarDays, ChevronRight, Crown, Radio, Users } from "lucide-react";
import type { Tournament } from "@/lib/types";
import { computeStandings } from "@/lib/formats";
import { countdownLabel } from "@/lib/util";
import { FormatBadge } from "./FormatBadge";
import { PlayerIdentity } from "./PlayerAvatar";

export function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const playable = t.matches.filter((m) => m.status !== "dead" && m.status !== "bye");
  const done = playable.filter((m) => m.status === "done").length;
  const live = t.matches.filter((m) => m.status === "live").length;
  const total = playable.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const leader = computeStandings(t)[0];
  const leaderPlayer = leader ? t.players.find((p) => p.id === leader.playerId) : undefined;
  const champ = t.championId ? t.players.find((p) => p.id === t.championId) : undefined;
  const cd = t.status !== "complete" ? countdownLabel(t.endDate) : null;

  return (
    <Link
      href={`/t?id=${t.id}`}
      className="panel group block p-4 transition hover:border-gold-300/40 hover:shadow-glow"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-cream">{t.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <FormatBadge format={t.format} />
            <span className="chip">
              <Users className="h-3.5 w-3.5" /> {t.players.length}
            </span>
            {live > 0 && (
              <span className="chip text-live">
                <Radio className="h-3.5 w-3.5 animate-pulse-live" /> {live} live
              </span>
            )}
            {cd && (
              <span className="chip">
                <CalendarDays className="h-3.5 w-3.5" /> {cd}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-gold-200" />
      </div>

      {champ ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-gold-500/10 px-3 py-2">
          <Crown className="h-4 w-4 shrink-0 text-gold-300" />
          <span className="text-xs text-muted">Champion</span>
          <span className="truncate font-semibold text-gold-100">{champ.name}</span>
        </div>
      ) : (
        leaderPlayer &&
        leader.points > 0 && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-ink-800/50 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wide text-muted">Leading</span>
            <PlayerIdentity player={leaderPlayer} size="sm" />
          </div>
        )
      )}

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/70">
          <div
            className="h-full rounded-full bg-gold-sheen transition-all"
            style={{ width: `${champ ? 100 : pct}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-muted">
          {done}/{total}
        </span>
      </div>
    </Link>
  );
}
