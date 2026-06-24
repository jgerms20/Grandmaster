import type { Match } from "@/lib/types";
import { loserId, winnerId } from "./helpers";

const keyOf = (t: { matchId: string; slot: string }) => `${t.matchId}:${t.slot}`;

/** Place a player into a target slot; returns true if it changed something. */
function place(byId: Map<string, Match>, target: { matchId: string; slot: "white" | "black" }, playerId: string): boolean {
  const m = byId.get(target.matchId);
  if (!m) return false;
  if (target.slot === "white") {
    if (m.whiteId === playerId) return false;
    m.whiteId = playerId;
  } else {
    if (m.blackId === playerId) return false;
    m.blackId = playerId;
  }
  return true;
}

/**
 * Normalize an elimination bracket in place:
 *  - flow winners/losers of decided matches into their downstream slots
 *  - auto-resolve byes (a slot that can never be filled, because its feeder was
 *    a bye, lets the present opponent advance for free)
 *  - mark fully-empty matches as "dead" and propagate that downstream
 *
 * Idempotent and convergent — safe to call after every result.
 */
export function normalizeElim(matches: Match[]): void {
  const byId = new Map(matches.map((m) => [m.id, m]));
  let changed = true;
  let guard = 0;

  while (changed && guard++ < 2000) {
    changed = false;

    // 1) Flow decided results downstream.
    for (const m of matches) {
      const decided = m.result === "white" || m.result === "black";
      if (!decided) continue;
      const w = winnerId(m);
      const l = loserId(m);
      if (m.winnerTo && w && place(byId, m.winnerTo, w)) changed = true;
      if (m.loserTo && l && place(byId, m.loserTo, l)) changed = true;
    }

    // 2) Determine which slots are permanently unfillable ("dead").
    const dead = new Set<string>();
    for (const m of matches) {
      // A bye produced a winner but no loser → its loser target is dead.
      if (m.status === "bye" && m.result && m.loserTo) dead.add(keyOf(m.loserTo));
      // A dead match produces neither winner nor loser.
      if (m.status === "dead") {
        if (m.winnerTo) dead.add(keyOf(m.winnerTo));
        if (m.loserTo) dead.add(keyOf(m.loserTo));
      }
    }

    // 3) Resolve matches that have a dead slot.
    for (const m of matches) {
      if (!m.bracket || m.bracket === "grand_final") continue;
      if (m.status !== "pending") continue;
      const whiteDead = m.whiteId === null && dead.has(`${m.id}:white`);
      const blackDead = m.blackId === null && dead.has(`${m.id}:black`);
      if (m.whiteId !== null && blackDead) {
        m.status = "bye";
        m.result = "white";
        m.blackPlaceholder = "Bye";
        changed = true;
      } else if (m.blackId !== null && whiteDead) {
        m.status = "bye";
        m.result = "black";
        m.whitePlaceholder = "Bye";
        changed = true;
      } else if (whiteDead && blackDead) {
        m.status = "dead";
        m.result = null;
        changed = true;
      }
    }
  }
}

/** The champion id if the final/grand-final is decided, else null. */
export function bracketChampion(matches: Match[]): string | null {
  const finals = matches.filter((m) => !m.winnerTo && m.bracket && m.status === "done");
  // Prefer an explicit grand final; otherwise the lone winners-bracket final.
  const gf = finals.find((m) => m.bracket === "grand_final") ?? finals[0];
  return gf ? winnerId(gf) : null;
}
