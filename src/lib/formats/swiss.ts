import type { Color, Match, Player, Tournament } from "@/lib/types";
import { bySeed, mkMatch } from "./helpers";
import { computeStandings } from "./standings";

export function swissRecommendedRounds(n: number): number {
  return Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
}

interface History {
  opponents: Map<string, Set<string>>;
  whites: Map<string, number>;
  lastColor: Map<string, Color | null>;
  hadBye: Set<string>;
}

function buildHistory(t: Tournament): History {
  const opponents = new Map<string, Set<string>>();
  const whites = new Map<string, number>();
  const lastColor = new Map<string, Color | null>();
  const hadBye = new Set<string>();
  for (const p of t.players) {
    opponents.set(p.id, new Set());
    whites.set(p.id, 0);
    lastColor.set(p.id, null);
  }
  const ordered = t.matches.slice().sort((a, b) => a.round - b.round);
  for (const m of ordered) {
    if (m.status === "bye") {
      if (m.whiteId) hadBye.add(m.whiteId);
      continue;
    }
    if (m.whiteId && m.blackId) {
      opponents.get(m.whiteId)?.add(m.blackId);
      opponents.get(m.blackId)?.add(m.whiteId);
      whites.set(m.whiteId, (whites.get(m.whiteId) ?? 0) + 1);
      lastColor.set(m.whiteId, "white");
      lastColor.set(m.blackId, "black");
    }
  }
  return { opponents, whites, lastColor, hadBye };
}

/** Decide colors for a pairing to keep each player's white/black balanced. */
function assignColors(a: string, b: string, h: History): { white: string; black: string } {
  const wa = h.whites.get(a) ?? 0;
  const wb = h.whites.get(b) ?? 0;
  if (wa !== wb) return wa < wb ? { white: a, black: b } : { white: b, black: a };
  // Equal white counts → give white to whoever had black last.
  const la = h.lastColor.get(a);
  const lb = h.lastColor.get(b);
  if (la === "black" && lb !== "black") return { white: a, black: b };
  if (lb === "black" && la !== "black") return { white: b, black: a };
  return { white: a, black: b };
}

/** First-round pairing: top half vs bottom half by seed. */
function round1(players: readonly Player[]): Match[] {
  const seeded = bySeed(players);
  const n = seeded.length;
  const half = Math.ceil(n / 2);
  const s1 = seeded.slice(0, half);
  const s2 = seeded.slice(half);
  const out: Match[] = [];
  for (let i = 0; i < s2.length; i++) {
    const a = s1[i].id;
    const b = s2[i].id;
    const { white, black } = i % 2 === 0 ? { white: a, black: b } : { white: b, black: a };
    out.push(mkMatch({ round: 1, order: i, whiteId: white, blackId: black }));
  }
  if (n % 2 === 1) {
    // Lowest seed in the top group takes the bye.
    out.push(
      mkMatch({
        round: 1,
        order: out.length,
        whiteId: s1[s1.length - 1].id,
        status: "bye",
        result: "white",
        blackPlaceholder: "Bye (+1)",
      }),
    );
  }
  return out;
}

/** Pair a later round by score group, avoiding rematches where possible. */
function laterRound(t: Tournament, round: number): Match[] {
  const standings = computeStandings(t);
  const h = buildHistory(t);
  let pool = standings.map((s) => s.playerId);
  const out: Match[] = [];
  let order = 0;

  if (pool.length % 2 === 1) {
    let byeId = pool[pool.length - 1];
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!h.hadBye.has(pool[i])) {
        byeId = pool[i];
        break;
      }
    }
    pool = pool.filter((id) => id !== byeId);
    out.push(
      mkMatch({
        round,
        order: order++,
        whiteId: byeId,
        status: "bye",
        result: "white",
        blackPlaceholder: "Bye (+1)",
      }),
    );
  }

  const remaining = [...pool];
  while (remaining.length > 0) {
    const a = remaining.shift()!;
    let idx = remaining.findIndex((b) => !h.opponents.get(a)?.has(b));
    if (idx === -1) idx = 0; // forced rematch when unavoidable
    const b = remaining.splice(idx, 1)[0];
    const { white, black } = assignColors(a, b, h);
    out.push(mkMatch({ round, order: order++, whiteId: white, blackId: black }));
  }
  return out;
}

export function generateSwissRound(t: Tournament, round: number): Match[] {
  return round <= 1 ? round1(t.players) : laterRound(t, round);
}
