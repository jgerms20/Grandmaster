import type { Match, Rules, StandingRow, Tournament } from "@/lib/types";

interface Tally {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  whites: number;
  blacks: number;
  /** opponents drawn against and beaten, for tiebreak */
  beat: string[];
  drew: string[];
}

function emptyTally(): Tally {
  return { played: 0, wins: 0, draws: 0, losses: 0, points: 0, whites: 0, blacks: 0, beat: [], drew: [] };
}

/** Apply one decided/bye match to the running tallies. */
function applyMatch(tallies: Map<string, Tally>, m: Match, rules: Rules): void {
  const white = m.whiteId ? tallies.get(m.whiteId) : undefined;
  const black = m.blackId ? tallies.get(m.blackId) : undefined;

  // Bye that awards a point (Swiss) — result "white" with no black opponent.
  if (m.status === "bye") {
    if (m.result === "white" && white && m.whiteId) {
      white.played += 1;
      white.wins += 1;
      white.points += rules.pointsWin;
    }
    return;
  }

  if (m.status !== "done" || m.result === null) return;

  if (white && m.whiteId) white.whites += 1;
  if (black && m.blackId) black.blacks += 1;

  if (m.result === "draw") {
    if (white) {
      white.played += 1;
      white.draws += 1;
      white.points += rules.pointsDraw;
      if (m.blackId) white.drew.push(m.blackId);
    }
    if (black) {
      black.played += 1;
      black.draws += 1;
      black.points += rules.pointsDraw;
      if (m.whiteId) black.drew.push(m.whiteId);
    }
    return;
  }

  const winnerSide = m.result; // "white" | "black"
  if (white) {
    white.played += 1;
    if (winnerSide === "white") {
      white.wins += 1;
      white.points += rules.pointsWin;
      if (m.blackId) white.beat.push(m.blackId);
    } else {
      white.losses += 1;
      white.points += rules.pointsLoss;
    }
  }
  if (black) {
    black.played += 1;
    if (winnerSide === "black") {
      black.wins += 1;
      black.points += rules.pointsWin;
      if (m.whiteId) black.beat.push(m.whiteId);
    } else {
      black.losses += 1;
      black.points += rules.pointsLoss;
    }
  }
}

/**
 * Compute ranked standings from a tournament's matches.
 * Sort: points ▸ Sonneborn–Berger tiebreak ▸ wins ▸ seed.
 */
export function computeStandings(t: Tournament): StandingRow[] {
  const tallies = new Map<string, Tally>();
  for (const p of t.players) tallies.set(p.id, emptyTally());

  for (const m of t.matches) applyMatch(tallies, m, t.rules);

  // Sonneborn–Berger: sum of beaten opponents' points + half of drawn opponents'.
  const pointsOf = (id: string) => tallies.get(id)?.points ?? 0;
  const seedOf = new Map(t.players.map((p) => [p.id, p.seed]));

  const rows: StandingRow[] = t.players.map((p) => {
    const tt = tallies.get(p.id)!;
    const tiebreak =
      tt.beat.reduce((s, id) => s + pointsOf(id), 0) +
      tt.drew.reduce((s, id) => s + pointsOf(id) / 2, 0);
    return {
      playerId: p.id,
      rank: 0,
      played: tt.played,
      wins: tt.wins,
      draws: tt.draws,
      losses: tt.losses,
      points: tt.points,
      whites: tt.whites,
      blacks: tt.blacks,
      tiebreak,
    };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.tiebreak - a.tiebreak ||
      b.wins - a.wins ||
      (seedOf.get(a.playerId)! - seedOf.get(b.playerId)!),
  );
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}
