import type { Color, Match, Player } from "@/lib/types";
import { uid } from "@/lib/util";

/** Players ordered by their seed (1 = top seed). */
export function bySeed(players: readonly Player[]): Player[] {
  return players.slice().sort((a, b) => a.seed - b.seed);
}

interface MkMatchInput {
  round: number;
  order: number;
  whiteId?: string | null;
  blackId?: string | null;
  bracket?: Match["bracket"];
  status?: Match["status"];
  result?: Match["result"];
  whitePlaceholder?: string;
  blackPlaceholder?: string;
}

export function mkMatch(input: MkMatchInput): Match {
  return {
    id: uid("m"),
    round: input.round,
    order: input.order,
    bracket: input.bracket,
    whiteId: input.whiteId ?? null,
    blackId: input.blackId ?? null,
    status: input.status ?? "pending",
    result: input.result ?? null,
    winnerTo: null,
    loserTo: null,
    whitePlaceholder: input.whitePlaceholder,
    blackPlaceholder: input.blackPlaceholder,
  };
}

/** The player id that should take a given color for a decided/bye match. */
export function winnerId(m: Match): string | null {
  if (m.result === "white") return m.whiteId;
  if (m.result === "black") return m.blackId;
  return null;
}

export function loserId(m: Match): string | null {
  if (m.result === "white") return m.blackId;
  if (m.result === "black") return m.whiteId;
  return null;
}

/** Place a player into a target match's white or black slot. */
export function placeInto(
  matches: Match[],
  target: { matchId: string; slot: Color },
  playerId: string,
): void {
  const m = matches.find((x) => x.id === target.matchId);
  if (!m) return;
  if (target.slot === "white") m.whiteId = playerId;
  else m.blackId = playerId;
}
