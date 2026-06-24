import type { Format, Match, MatchResult, Player, Rules, Tournament } from "@/lib/types";
import { nowIso, uid } from "@/lib/util";
import { bracketChampion, normalizeElim } from "./advance";
import { generateDoubleElim } from "./doubleElim";
import { generateRoundRobin } from "./roundRobin";
import { generateSingleElim } from "./singleElim";
import { computeStandings } from "./standings";
import { generateSwissRound, swissRecommendedRounds } from "./swiss";

export { computeStandings } from "./standings";

export const TIME_CONTROL_PRESETS = [
  { value: "3|2", label: "3|2 · Blitz" },
  { value: "5|0", label: "5|0 · Blitz" },
  { value: "10|0", label: "10|0 · Rapid" },
  { value: "15|10", label: "15|10 · Rapid" },
  { value: "30|0", label: "30|0 · Classical" },
];

export function defaultRules(format: Format): Rules {
  return {
    timeControl: format === "round_robin" ? "15|10" : "10|0",
    pointsWin: 1,
    pointsDraw: 0.5,
    pointsLoss: 0,
    rematchOnDraw: false,
    tiebreak: "Sonneborn–Berger, then most wins, then seed.",
    description: "",
  };
}

export function recommendedRounds(format: Format, n: number): number {
  return format === "swiss" ? swissRecommendedRounds(n) : 0;
}

function isElim(format: Format): boolean {
  return format === "single_elim" || format === "double_elim";
}

function generateMatches(format: Format, players: Player[]): Match[] {
  switch (format) {
    case "round_robin":
      return generateRoundRobin(players);
    case "single_elim": {
      const m = generateSingleElim(players);
      normalizeElim(m);
      return m;
    }
    case "double_elim": {
      const m = generateDoubleElim(players);
      normalizeElim(m);
      return m;
    }
    case "swiss":
      return generateSwissRound({ players } as Tournament, 1);
  }
}

export interface CreateInput {
  name: string;
  format: Format;
  players: Array<{ name: string; chessUsername?: string }>;
  rules?: Partial<Rules>;
  plannedRounds?: number;
  adminCode?: string;
}

export function createTournament(input: CreateInput): Tournament {
  const players: Player[] = input.players.map((p, i) => ({
    id: uid("p"),
    name: p.name.trim(),
    chessUsername: p.chessUsername?.trim() || undefined,
    seed: i + 1,
  }));

  const rules: Rules = { ...defaultRules(input.format), ...input.rules };
  const matches = generateMatches(input.format, players);
  const plannedRounds =
    input.format === "swiss"
      ? input.plannedRounds || swissRecommendedRounds(players.length)
      : 0;

  const now = nowIso();
  return {
    id: uid("t"),
    name: input.name.trim() || "Untitled Tournament",
    format: input.format,
    status: "active",
    players,
    matches,
    rules,
    plannedRounds,
    currentRound: 1,
    championId: null,
    createdAt: now,
    updatedAt: now,
    adminCode: input.adminCode?.trim() || uid().slice(0, 6),
  };
}

function activeRound(matches: Match[]): number {
  const pending = matches.filter((m) => m.status === "pending" || m.status === "live");
  if (pending.length === 0) return matches.reduce((mx, m) => Math.max(mx, m.round), 1);
  return pending.reduce((mn, m) => Math.min(mn, m.round), Infinity);
}

function roundComplete(matches: Match[], round: number): boolean {
  const inRound = matches.filter((m) => m.round === round && m.bracket == null);
  return inRound.length > 0 && inRound.every((m) => m.status === "done" || m.status === "bye");
}

/** Deep clone so callers can treat tournaments as immutable. */
function clone(t: Tournament): Tournament {
  return typeof structuredClone === "function"
    ? structuredClone(t)
    : JSON.parse(JSON.stringify(t));
}

interface ResultOpts {
  moves?: number;
  gameUrl?: string;
}

export function setMatchResult(
  tournament: Tournament,
  matchId: string,
  result: MatchResult,
  opts: ResultOpts = {},
): Tournament {
  const t = clone(tournament);
  const m = t.matches.find((x) => x.id === matchId);
  if (!m) return t;

  m.result = result;
  m.status = result === null ? "pending" : "done";
  if (opts.moves !== undefined) m.moves = opts.moves;
  if (opts.gameUrl !== undefined) m.gameUrl = opts.gameUrl;
  if (result !== null) m.endedAt = nowIso();
  else m.endedAt = undefined;

  if (isElim(t.format)) {
    normalizeElim(t.matches);
    t.championId = bracketChampion(t.matches);
    t.status = t.championId ? "complete" : "active";
  } else {
    // Swiss: when a round wraps up, generate the next round's pairings.
    if (t.format === "swiss") {
      const r = activeRound(t.matches);
      if (roundComplete(t.matches, r) && r < t.plannedRounds) {
        const next = generateSwissRound(t, r + 1);
        t.matches.push(...next);
      }
    }
    const stillPlaying = t.matches.some((x) => x.status === "pending" || x.status === "live");
    const reachedEnd =
      t.format === "round_robin"
        ? !stillPlaying
        : activeRound(t.matches) >= t.plannedRounds && !stillPlaying;
    if (reachedEnd) {
      t.status = "complete";
      t.championId = computeStandings(t)[0]?.playerId ?? null;
    } else {
      t.status = "active";
      t.championId = null;
    }
  }

  t.currentRound = activeRound(t.matches);
  t.updatedAt = nowIso();
  return t;
}

export function setMatchLive(tournament: Tournament, matchId: string, live: boolean): Tournament {
  const t = clone(tournament);
  const m = t.matches.find((x) => x.id === matchId);
  if (!m || m.status === "done" || m.status === "bye") return t;
  m.status = live ? "live" : "pending";
  if (live && !m.startedAt) m.startedAt = nowIso();
  t.updatedAt = nowIso();
  return t;
}

export function setMatchMeta(
  tournament: Tournament,
  matchId: string,
  meta: { gameUrl?: string; moves?: number },
): Tournament {
  const t = clone(tournament);
  const m = t.matches.find((x) => x.id === matchId);
  if (!m) return t;
  if (meta.gameUrl !== undefined) m.gameUrl = meta.gameUrl || undefined;
  if (meta.moves !== undefined) m.moves = meta.moves;
  t.updatedAt = nowIso();
  return t;
}
