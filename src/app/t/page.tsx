"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  ExternalLink,
  KeyRound,
  Lock,
  Radio,
  Settings2,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import { BracketColumns, singleElimLabel, type BracketHandlers } from "@/components/Bracket";
import { FormatBadge } from "@/components/FormatBadge";
import { MatchCard } from "@/components/MatchCard";
import { PlayerIdentity } from "@/components/PlayerAvatar";
import { StandingsTable } from "@/components/StandingsTable";
import { chessProfileUrl } from "@/lib/chesscom";
import { setMatchLive, setMatchMeta, setMatchResult } from "@/lib/formats";
import { commit, useTournament } from "@/lib/store";
import type { Match, MatchResult, Player, Tournament } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/types";
import { useOrganizer } from "@/lib/useOrganizer";

export default function TournamentPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse bg-ink-800/40" />}>
      <TournamentView />
    </Suspense>
  );
}

function TournamentView() {
  const id = useSearchParams().get("id") ?? "";
  const { data: t, loading } = useTournament(id);
  const org = useOrganizer(t);

  if (loading) {
    return <div className="panel h-64 animate-pulse bg-ink-800/40" />;
  }
  if (!t) {
    return (
      <div className="panel flex flex-col items-center gap-4 p-12 text-center">
        <p className="font-display text-xl text-cream">Tournament not found</p>
        <p className="text-sm text-muted">It may have been created in another browser, or removed.</p>
        <Link href="/" className="btn-gold">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const handlers: BracketHandlers = {
    organizer: org.unlocked,
    onResult: (mid, r) => commit(setMatchResult(t, mid, r)),
    onLive: (mid, live) => commit(setMatchLive(t, mid, live)),
    onMeta: (mid, meta) => commit(setMatchMeta(t, mid, meta)),
  };

  const playersMap = new Map<string, Player>(t.players.map((p) => [p.id, p]));
  const champ = t.championId ? playersMap.get(t.championId) : undefined;
  const liveCount = t.matches.filter((m) => m.status === "live").length;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> All tournaments
      </Link>

      {/* Header */}
      <header className="panel relative overflow-hidden p-5 sm:p-6">
        <div className="bg-ink-fade pointer-events-none absolute inset-0" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-cream sm:text-4xl">{t.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <FormatBadge format={t.format} />
              <span className="chip"><Users className="h-3.5 w-3.5" /> {t.players.length} players</span>
              {liveCount > 0 && (
                <span className="chip text-live"><Radio className="h-3.5 w-3.5 animate-pulse-live" /> {liveCount} live now</span>
              )}
              <StatusChip status={t.status} />
            </div>
          </div>
          <ShareButton />
        </div>
      </header>

      {champ && <ChampionBanner player={champ} />}

      <OrganizerBar tournament={t} org={org} />

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {t.format === "single_elim" && (
            <Panel title="Bracket">
              <BracketColumns
                matches={t.matches.filter((m) => m.bracket === "winners")}
                players={playersMap}
                labelOf={singleElimLabel}
                handlers={handlers}
              />
            </Panel>
          )}

          {t.format === "double_elim" && <DoubleElim t={t} players={playersMap} handlers={handlers} />}

          {(t.format === "round_robin" || t.format === "swiss") && (
            <>
              <Panel title="Standings">
                <StandingsTable tournament={t} />
              </Panel>
              <Rounds t={t} players={playersMap} handlers={handlers} />
            </>
          )}
        </div>

        <aside className="space-y-6">
          <RulesPanel tournament={t} />
          <PlayersPanel tournament={t} />
        </aside>
      </div>
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-cream">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusChip({ status }: { status: Tournament["status"] }) {
  if (status === "complete")
    return <span className="chip text-gold-200"><Trophy className="h-3.5 w-3.5" /> Complete</span>;
  return <span className="chip text-win"><span className="h-1.5 w-1.5 rounded-full bg-win" /> In progress</span>;
}

function ChampionBanner({ player }: { player: Player }) {
  return (
    <div className="panel board-texture relative flex items-center gap-4 overflow-hidden p-5">
      <div className="bg-ink-fade pointer-events-none absolute inset-0" />
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gold-sheen text-ink-950 shadow-glow">
        <Crown className="h-7 w-7" />
      </div>
      <div className="relative">
        <p className="label text-gold-200">Champion</p>
        <p className="font-display text-2xl font-bold text-cream">{player.name}</p>
      </div>
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: "Grandmaster tournament", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed */
    }
  };
  return (
    <button onClick={share} className="btn-ghost shrink-0">
      {copied ? <Check className="h-4 w-4 text-win" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

function OrganizerBar({
  tournament,
  org,
}: {
  tournament: Tournament;
  org: ReturnType<typeof useOrganizer>;
}) {
  const [code, setCode] = useState("");
  const [bad, setBad] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (org.unlocked) {
    return (
      <div className="panel-flat flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-gold-200">
          <Settings2 className="h-4 w-4" /> Organizer mode — tap a score to record results.
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-cream"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {showCode ? tournament.adminCode : "Show code"}
          </button>
          {showCode && (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(tournament.adminCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-muted hover:text-cream"
              title="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-win" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          <button onClick={org.lock} className="btn-subtle px-3 py-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" /> Lock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-flat flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-muted">
        You&apos;re viewing live. <span className="text-cream">Running this tournament?</span> Enter the organizer code.
      </span>
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setBad(false);
          }}
          placeholder="organizer code"
          className={`w-40 rounded-lg border bg-ink-900/60 px-3 py-1.5 text-sm focus:outline-none ${
            bad ? "border-loss/60" : "border-ink-600/70"
          }`}
        />
        <button
          onClick={() => {
            if (!org.unlock(code)) setBad(true);
          }}
          className="btn-gold px-3 py-1.5 text-xs"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function DoubleElim({
  t,
  players,
  handlers,
}: {
  t: Tournament;
  players: Map<string, Player>;
  handlers: BracketHandlers;
}) {
  const gf = t.matches.find((m) => m.bracket === "grand_final");
  return (
    <div className="space-y-6">
      <Panel title="Winners bracket">
        <BracketColumns
          matches={t.matches.filter((m) => m.bracket === "winners")}
          players={players}
          labelOf={(r, total) => (r === total ? "Winners Final" : `Winners · Round ${r}`)}
          handlers={handlers}
        />
      </Panel>
      <Panel title="Losers bracket">
        <BracketColumns
          matches={t.matches.filter((m) => m.bracket === "losers")}
          players={players}
          labelOf={(r, total) => (r === total ? "Losers Final" : `Losers · Round ${r}`)}
          handlers={handlers}
        />
      </Panel>
      {gf && (
        <Panel title="Grand final">
          <div className="max-w-sm">
            <MatchCard
              match={gf}
              white={gf.whiteId ? players.get(gf.whiteId) : null}
              black={gf.blackId ? players.get(gf.blackId) : null}
              label="Grand Final"
              organizer={handlers.organizer}
              onResult={handlers.onResult}
              onLive={handlers.onLive}
              onMeta={handlers.onMeta}
            />
          </div>
        </Panel>
      )}
    </div>
  );
}

function Rounds({
  t,
  players,
  handlers,
}: {
  t: Tournament;
  players: Map<string, Player>;
  handlers: BracketHandlers;
}) {
  const rounds = useMemo(() => {
    const set = new Set(t.matches.filter((m) => m.bracket == null).map((m) => m.round));
    return [...set].sort((a, b) => a - b);
  }, [t.matches]);

  return (
    <div className="space-y-5">
      {rounds.map((r) => {
        const ms = t.matches
          .filter((m) => m.bracket == null && m.round === r)
          .sort((a, b) => a.order - b.order);
        const isCurrent = r === t.currentRound && t.status !== "complete";
        return (
          <section key={r}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-cream">Round {r}</h3>
              {isCurrent && (
                <span className="chip text-gold-200">
                  <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-gold-300" /> Current
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ms.map((m: Match) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  white={m.whiteId ? players.get(m.whiteId) : null}
                  black={m.blackId ? players.get(m.blackId) : null}
                  label={`Board ${m.order + 1}`}
                  organizer={handlers.organizer}
                  onResult={handlers.onResult}
                  onLive={handlers.onLive}
                  onMeta={handlers.onMeta}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RulesPanel({ tournament: t }: { tournament: Tournament }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-lg font-semibold text-cream">Rules</h3>
      <dl className="space-y-2.5 text-sm">
        <Row label="Time control" value={t.rules.timeControl} mono />
        <Row label="Scoring" value={`${t.rules.pointsWin} / ${t.rules.pointsDraw} / ${t.rules.pointsLoss}`} mono />
        {t.format === "swiss" && <Row label="Rounds" value={String(t.plannedRounds)} mono />}
        <Row label="Replay draws" value={t.rules.rematchOnDraw ? "Yes" : "No"} />
        <div>
          <dt className="label">Tiebreak</dt>
          <dd className="mt-0.5 text-muted">{t.rules.tiebreak}</dd>
        </div>
      </dl>
      {t.rules.description && (
        <div className="mt-3 rounded-xl border-l-2 border-gold-300/60 bg-ink-900/50 px-3 py-2.5 text-sm italic text-cream/90">
          {t.rules.description}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="label">{label}</dt>
      <dd className={`text-cream ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function PlayersPanel({ tournament: t }: { tournament: Tournament }) {
  const ordered = [...t.players].sort((a, b) => a.seed - b.seed);
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-lg font-semibold text-cream">Players</h3>
      <ul className="space-y-2">
        {ordered.map((p) => {
          const url = p.profileUrl ?? chessProfileUrl(p.chessUsername);
          return (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-center font-mono text-[11px] text-muted">{p.seed}</span>
                <PlayerIdentity player={p} size="sm" />
              </div>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-muted hover:text-gold-200" title="Chess.com profile">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
