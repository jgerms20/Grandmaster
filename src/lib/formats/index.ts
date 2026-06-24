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
  { value: "1 day", label: "1 day · Daily" },
  { value: "3 days", label: "3 days · Daily" },
  { value: "7 days", label: "7 days · Daily" },
  { value: "10|0", label: "10|0 · Rapid" },
  { value: "15|10", label: "15|10 · Rapid" },
  { value: "5|0", label: "5|0 · Blitz" },
  { value: "30|0", label: "30|0 · Classical" },
];

export const DURATION_PRESETS = [
  { days: 1, label: "1 day" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 21, label: "3 weeks" },
  { days: 28, label: "4 weeks" },
  { days: 0, label: "No deadline" },
];

export const TIEBREAK_OPTIONS = [
  "Sonneborn–Berger, then most wins, then seed.",
  "Head-to-head result between tied players.",
  "Most wins, then most games as Black.",
  "Buchholz — sum of opponents' scores.",
  "Blitz playoff between tied players.",
];

export function defaultRules(format: Format): Rules {
  return {
    timeControl: "3 days",
    pointsWin: 1,
    pointsDraw: 0.5,
    pointsLoss: 0,
    rematchOnDraw: false,
    tiebreak: TIEBREAK_OPTIONS[0],
    description: "",
  };
}

function durationLabel(days: number): string {
  if (!days) return "no fixed deadline";
  if (days === 1) return "a single day";
  if (days === 7) return "about a week";
  if (days === 14) return "about two weeks";
  if (days === 21) return "about three weeks";
  if (days === 28) return "about a month";
  return `${days} days`;
}

export interface Suggestion {
  rules: Partial<Rules>;
  plannedRounds?: number;
}

/**
 * Context-aware rule suggestions. Reads the format, field size and intended
 * length to recommend a pace, scoring, tiebreak and a written rules summary —
 * so the organizer gets a sensible, tailored starting point in one tap.
 */
export function suggestRules(format: Format, playerCount: number, durationDays: number): Suggestion {
  const n = Math.max(2, playerCount);
  const fast = durationDays === 1;
  const timeControl = fast ? "10|0" : durationDays && durationDays <= 3 ? "1 day" : "3 days";
  const pace = fast
    ? "Games are played live at 10|0 in one sitting."
    : `Games are daily (${timeControl} per move) — make at least one move a day.`;
  const dur = durationLabel(durationDays);
  const rounds = format === "swiss" ? swissRecommendedRounds(n) : 0;

  const drawLine =
    format === "single_elim" || format === "double_elim"
      ? "A drawn game is replayed at a faster time control until someone wins."
      : "A win is worth 1 point, a draw ½, a loss 0.";

  let description: string;
  let tiebreak = TIEBREAK_OPTIONS[0];
  switch (format) {
    case "round_robin":
      description = `${n}-player round robin over ${dur}: everyone plays everyone once (${n - 1} games each). ${pace} ${drawLine} Most points wins; ties broken by Sonneborn–Berger.`;
      break;
    case "single_elim":
      description = `${n}-player single-elimination knockout over ${dur}. ${pace} Higher seed takes White; lose once and you're out. ${drawLine} Last player standing is champion.`;
      tiebreak = "Single game decides; replay faster if drawn.";
      break;
    case "double_elim":
      description = `${n}-player double elimination over ${dur}. ${pace} One loss drops you to the lower bracket — you're out after two. ${drawLine} The lower-bracket survivor meets the upper-bracket winner in the grand final.`;
      tiebreak = "Lower bracket is the second chance; grand final decides.";
      break;
    case "swiss":
      description = `${n}-player Swiss over ${rounds} rounds in ${dur}. Each round you're paired against someone on your score — no eliminations. ${pace} Most points after ${rounds} rounds wins; ties broken by Buchholz.`;
      tiebreak = "Buchholz — sum of opponents' scores.";
      break;
  }

  return {
    rules: { timeControl, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, tiebreak, description },
    plannedRounds: rounds || undefined,
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
  durationDays?: number;
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
  const durationDays = input.durationDays ?? 0;
  const endDate = durationDays > 0 ? new Date(Date.now() + durationDays * 86400000).toISOString() : undefined;
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
    startDate: now,
    endDate,
    durationDays,
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
