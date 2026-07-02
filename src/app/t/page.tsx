"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Crown,
  ExternalLink,
  KeyRound,
  Lock,
  Radio,
  RefreshCw,
  Repeat,
  Settings2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { BracketColumns, singleElimLabel, type BracketHandlers } from "@/components/Bracket";
import { Confetti } from "@/components/Confetti";
import { FormatBadge } from "@/components/FormatBadge";
import { MatchCard } from "@/components/MatchCard";
import { PlayerIdentity } from "@/components/PlayerAvatar";
import { SettingsModal } from "@/components/SettingsModal";
import { ShareModal } from "@/components/ShareModal";
import { StandingsTable } from "@/components/StandingsTable";
import {
  chessProfileUrl,
  findCurrentDailyGame,
  findRecentFinishedGame,
  lookupChessInfo,
} from "@/lib/chesscom";
import { setMatchLive, setMatchMeta, setMatchResult, updateSettings } from "@/lib/formats";
import { commit, useTournament } from "@/lib/store";
import type { Match, Player, Tournament } from "@/lib/types";
import { useOrganizer } from "@/lib/useOrganizer";
import { countdownLabel, formatShortDate, nowIso } from "@/lib/util";

export default function TournamentPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse bg-ink-800/40" />}>
      <TournamentView />
    </Suspense>
  );
}

function TournamentView() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const inviteKey = params.get("key");
  const router = useRouter();
  const pathname = usePathname();
  const { data: t, loading } = useTournament(id);
  const org = useOrganizer(t);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const autoUnlocked = useRef(false);

  // Organizer link (?key=CODE): unlock automatically, then strip the key from the URL.
  useEffect(() => {
    if (!t || !inviteKey || autoUnlocked.current) return;
    autoUnlocked.current = true;
    if (inviteKey === t.adminCode) org.unlock(inviteKey);
    router.replace(`${pathname}?id=${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, inviteKey]);

  // Confetti the first time this browser session sees the champion.
  const status = t?.status;
  const championId = t?.championId;
  useEffect(() => {
    if (!t || status !== "complete" || !championId) return;
    const k = `grandmaster:celebrated:${t.id}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* still celebrate */
    }
    setCelebrate(true);
    const timer = setTimeout(() => setCelebrate(false), 7000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, championId]);

  if (loading) {
    return <div className="panel h-64 animate-pulse bg-ink-800/40" />;
  }
  if (!t) {
    return (
      <div className="panel flex flex-col items-center gap-4 p-12 text-center">
        <p className="font-display text-xl font-bold text-cream">Tournament not found</p>
        <p className="text-sm text-muted">It may have been created in another browser, or removed.</p>
        <Link href="/" className="btn-gold">
          Back to tournaments
        </Link>
      </div>
    );
  }

  const playersMap = new Map<string, Player>(t.players.map((p) => [p.id, p]));

  /** Pull the real game between the two players from Chess.com. */
  const onSync = async (mid: string): Promise<string | null> => {
    const m = t.matches.find((x) => x.id === mid);
    if (!m) return "Match not found";
    const w = m.whiteId ? playersMap.get(m.whiteId) : null;
    const b = m.blackId ? playersMap.get(m.blackId) : null;
    if (!w?.chessUsername || !b?.chessUsername) return "Both players need a Chess.com username";
    const wu = w.chessUsername.trim().toLowerCase();
    const since = new Date(m.startedAt ?? t.startDate ?? t.createdAt).getTime();

    const finished = await findRecentFinishedGame(w.chessUsername, b.chessUsername, since);
    if (finished && m.status !== "done") {
      // Map the game's colors onto our color assignment (they may be reversed).
      const same = finished.whiteUsername === wu;
      const result =
        finished.result === "draw" ? "draw" : same ? finished.result : finished.result === "white" ? "black" : "white";
      await commit(setMatchResult(t, mid, result, { gameUrl: finished.url, moves: finished.moves }));
      return null;
    }

    const current = await findCurrentDailyGame(w.chessUsername, b.chessUsername);
    if (current) {
      const toMoveUser = current.turn === "white" ? current.whiteUsername : current.blackUsername;
      let next = setMatchMeta(t, mid, {
        gameUrl: current.url,
        moves: current.moves,
        turn: toMoveUser === wu ? "white" : "black",
      });
      next = setMatchLive(next, mid, true);
      await commit(next);
      return null;
    }
    return "No Chess.com game found between these two yet";
  };

  const handlers: BracketHandlers = {
    organizer: org.unlocked,
    onResult: (mid, r) => commit(setMatchResult(t, mid, r)),
    onLive: (mid, live) => commit(setMatchLive(t, mid, live)),
    onMeta: (mid, meta) => commit(setMatchMeta(t, mid, meta)),
    onSync,
  };

  const champ = t.championId ? playersMap.get(t.championId) : undefined;
  const liveCount = t.matches.filter((m) => m.status === "live").length;
  const cd = countdownLabel(t.endDate);

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
            <h1 className="font-display text-3xl font-black tracking-tight text-cream sm:text-4xl">{t.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <FormatBadge format={t.format} />
              {t.cycles === 2 && (
                <span className="chip"><Repeat className="h-3.5 w-3.5 text-gold-200" /> Double — everyone twice</span>
              )}
              <span className="chip"><Users className="h-3.5 w-3.5" /> {t.players.length} players</span>
              {t.startDate && (
                <span className="chip">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatShortDate(t.startDate)}
                  {t.endDate ? ` – ${formatShortDate(t.endDate)}` : ""}
                </span>
              )}
              {cd && t.status !== "complete" && <span className="chip text-gold-200">{cd}</span>}
              {liveCount > 0 && (
                <span className="chip text-live"><Radio className="h-3.5 w-3.5 animate-pulse-live" /> {liveCount} live now</span>
              )}
              <StatusChip status={t.status} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {org.unlocked && (
              <button
                onClick={() => setShowSettings(true)}
                className="btn-ghost px-3"
                title="Tournament settings"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
            <button onClick={() => setShowInvite(true)} className="btn-gold">
              <UserPlus className="h-4 w-4" /> Invite
            </button>
          </div>
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
          <PlayersPanel tournament={t} organizer={org.unlocked} />
        </aside>
      </div>

      <Confetti fire={celebrate} />
      {showInvite && <ShareModal tournament={t} onClose={() => setShowInvite(false)} />}
      {showSettings && (
        <SettingsModal
          tournament={t}
          onClose={() => setShowSettings(false)}
          onSave={(patch) => commit(updateSettings(t, patch))}
        />
      )}
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
    <div className="panel board-8 relative flex items-center gap-4 overflow-hidden p-5">
      <div className="bg-ink-fade pointer-events-none absolute inset-0" />
      <div className="animate-crown relative grid h-14 w-14 place-items-center rounded-2xl bg-gold-sheen text-onaccent shadow-glow">
        <Crown className="h-7 w-7" />
      </div>
      <div className="relative">
        <p className="label text-gold-200">Champion</p>
        <p className="font-display text-2xl font-black tracking-tight text-cream">{player.name}</p>
      </div>
    </div>
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
              onSync={handlers.onSync}
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
                  onSync={handlers.onSync}
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

function PlayersPanel({ tournament: t, organizer }: { tournament: Tournament; organizer: boolean }) {
  const ordered = [...t.players].sort((a, b) => a.seed - b.seed);
  const [busy, setBusy] = useState(false);
  const hasUsernames = t.players.some((p) => p.chessUsername);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = structuredClone(t);
      await Promise.all(
        next.players.map(async (p) => {
          if (!p.chessUsername) return;
          const info = await lookupChessInfo(p.chessUsername);
          if (!info.found) return;
          p.avatarUrl = info.avatarUrl;
          p.rating = info.rating;
          p.title = info.title;
          p.countryCode = info.countryCode;
          p.profileUrl = info.profileUrl;
        }),
      );
      next.updatedAt = nowIso();
      await commit(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-cream">Players</h3>
        {organizer && hasUsernames && (
          <button
            onClick={refresh}
            disabled={busy}
            title="Refresh avatars & ratings from Chess.com"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted transition hover:text-gold-200 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> Ratings
          </button>
        )}
      </div>
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
