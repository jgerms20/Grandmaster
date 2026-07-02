import { describe, expect, it } from "vitest";
import type { Format, Match, Player, Tournament } from "@/lib/types";
import { createTournament, setMatchResult, updateSettings } from "./index";
import { roundRobinPairings, generateRoundRobin } from "./roundRobin";
import { generateSingleElim } from "./singleElim";
import { computeStandings } from "./standings";

function players(n: number): Array<{ name: string; chessUsername?: string }> {
  return Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}` }));
}

const seedOf = (t: Tournament, id: string | null) =>
  id ? (t.players.find((p) => p.id === id)?.seed ?? 999) : 999;

/** Play every decidable game letting the better seed (lower number) win. */
function playOut(t: Tournament): Tournament {
  let cur = t;
  for (let guard = 0; guard < 500; guard++) {
    const m = cur.matches.find(
      (x) =>
        (x.status === "pending" || x.status === "live") &&
        x.whiteId !== null &&
        x.blackId !== null,
    );
    if (!m) break;
    const winner = seedOf(cur, m.whiteId) < seedOf(cur, m.blackId) ? "white" : "black";
    cur = setMatchResult(cur, m.id, winner, { moves: 30 });
  }
  return cur;
}

function unorderedPairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

describe("round robin", () => {
  it("pairs every player exactly once (even count)", () => {
    const ids = ["a", "b", "c", "d"];
    const rounds = roundRobinPairings(ids);
    expect(rounds).toHaveLength(3);
    const seen = new Map<string, number>();
    for (const round of rounds) {
      for (const p of round) {
        if (p.black) {
          const k = unorderedPairKey(p.white, p.black);
          seen.set(k, (seen.get(k) ?? 0) + 1);
        }
      }
    }
    // 4 players → 6 unique pairs, each once.
    expect(seen.size).toBe(6);
    for (const c of seen.values()) expect(c).toBe(1);
  });

  it("gives each player exactly one bye (odd count)", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const rounds = roundRobinPairings(ids);
    expect(rounds).toHaveLength(5);
    const byes = new Map<string, number>();
    for (const round of rounds) {
      for (const p of round) {
        if (p.black === null) byes.set(p.white, (byes.get(p.white) ?? 0) + 1);
      }
    }
    for (const id of ids) expect(byes.get(id)).toBe(1);
  });

  it("produces a complete tournament with a clear winner", () => {
    const t = playOut(createTournament({ name: "RR", format: "round_robin", players: players(6) }));
    expect(t.status).toBe("complete");
    expect(seedOf(t, t.championId!)).toBe(1); // top seed wins everything
    expect(generateRoundRobin(t.players)).toHaveLength(15); // C(6,2)
  });

  it("double round robin plays every pair twice with colors reversed", () => {
    const t = createTournament({
      name: "DRR",
      format: "round_robin",
      players: players(4),
      cycles: 2,
    });
    expect(t.cycles).toBe(2);
    expect(t.matches).toHaveLength(12); // 2 × C(4,2)
    const byOrderedPair = new Map<string, number>();
    for (const m of t.matches) {
      const k = `${m.whiteId}>${m.blackId}`;
      byOrderedPair.set(k, (byOrderedPair.get(k) ?? 0) + 1);
    }
    // 12 distinct ordered pairs, each exactly once → every rematch flips colors.
    expect(byOrderedPair.size).toBe(12);
    for (const c of byOrderedPair.values()) expect(c).toBe(1);
    // And it plays out to completion.
    const done = playOut(t);
    expect(done.status).toBe("complete");
    expect(seedOf(done, done.championId!)).toBe(1);
  });
});

describe("single elimination", () => {
  it("auto-advances byes for non power-of-two fields", () => {
    const t = createTournament({ name: "SE", format: "single_elim", players: players(5) });
    const byes = t.matches.filter((m) => m.status === "bye");
    expect(byes.length).toBeGreaterThan(0);
    // Top seeds should already be sitting in round 2.
    const r2 = t.matches.filter((m) => m.round === 2);
    const filledR2Slots = r2.flatMap((m) => [m.whiteId, m.blackId]).filter(Boolean);
    expect(filledR2Slots.length).toBeGreaterThan(0);
  });

  it("crowns the top seed when the better seed always wins", () => {
    for (const n of [4, 5, 8, 11, 16]) {
      const t = playOut(createTournament({ name: "SE", format: "single_elim", players: players(n) }));
      expect(t.status).toBe("complete");
      expect(seedOf(t, t.championId!)).toBe(1);
    }
  });

  it("builds the right number of rounds", () => {
    const m = generateSingleElim(
      players(8).map((p, i): Player => ({ id: `p${i}`, name: p.name, seed: i + 1 })),
    );
    const rounds = new Set(m.map((x: Match) => x.round));
    expect(rounds.size).toBe(3); // 8 → QF, SF, F
  });
});

describe("double elimination", () => {
  it("has the expected match count for clean fields", () => {
    const t4 = createTournament({ name: "DE", format: "double_elim", players: players(4) });
    expect(t4.matches.length).toBe(6); // WB:3 + LB:2 + GF:1
    const t8 = createTournament({ name: "DE", format: "double_elim", players: players(8) });
    expect(t8.matches.length).toBe(14); // WB:7 + LB:6 + GF:1
  });

  it("crowns the top seed and finishes via the grand final", () => {
    for (const n of [4, 5, 8, 12, 16]) {
      const t = playOut(createTournament({ name: "DE", format: "double_elim", players: players(n) }));
      expect(t.status).toBe("complete");
      expect(seedOf(t, t.championId!)).toBe(1);
      const gf = t.matches.find((m) => m.bracket === "grand_final");
      expect(gf?.status).toBe("done");
    }
  });
});

describe("swiss", () => {
  it("avoids rematches in round two", () => {
    let t = createTournament({ name: "SW", format: "swiss", players: players(8) });
    expect(t.plannedRounds).toBe(3); // ceil(log2 8)
    // Play round 1 only.
    for (let i = 0; i < 50; i++) {
      const m = t.matches.find((x) => x.round === 1 && x.status === "pending" && x.whiteId && x.blackId);
      if (!m) break;
      t = setMatchResult(t, m.id, "white");
    }
    const r1Pairs = new Set(
      t.matches.filter((m) => m.round === 1 && m.blackId).map((m) => unorderedPairKey(m.whiteId!, m.blackId!)),
    );
    const r2 = t.matches.filter((m) => m.round === 2 && m.blackId);
    expect(r2.length).toBeGreaterThan(0);
    for (const m of r2) {
      expect(r1Pairs.has(unorderedPairKey(m.whiteId!, m.blackId!))).toBe(false);
    }
  });

  it("completes after the planned number of rounds", () => {
    const t = playOut(createTournament({ name: "SW", format: "swiss", players: players(8) }));
    expect(t.status).toBe("complete");
    const rounds = new Set(t.matches.map((m) => m.round));
    expect(rounds.size).toBe(3);
    expect(seedOf(t, t.championId!)).toBe(1);
  });

  it("handles an odd field with byes", () => {
    const t = playOut(createTournament({ name: "SW", format: "swiss", players: players(7) }));
    expect(t.status).toBe("complete");
    expect(t.matches.some((m) => m.status === "bye")).toBe(true);
  });
});

describe("standings", () => {
  it("ranks by points then tiebreak", () => {
    const t = playOut(createTournament({ name: "RR", format: "round_robin", players: players(4) }));
    const table = computeStandings(t);
    expect(table[0].rank).toBe(1);
    expect(table[0].points).toBeGreaterThanOrEqual(table[table.length - 1].points);
    // Every game decided → played counts add up.
    expect(table.reduce((s, r) => s + r.played, 0)).toBeGreaterThan(0);
  });

  const formats: Format[] = ["round_robin", "single_elim", "double_elim", "swiss"];
  it("never leaves a started tournament without a champion", () => {
    for (const format of formats) {
      const t = playOut(createTournament({ name: format, format, players: players(6) }));
      expect(t.championId, `format ${format}`).toBeTruthy();
    }
  });
});

describe("settings", () => {
  it("updates name, rules and deadline without touching matches", () => {
    const t = createTournament({
      name: "Before",
      format: "round_robin",
      players: players(4),
      durationDays: 7,
    });
    const next = updateSettings(t, {
      name: "After",
      rules: { timeControl: "1 day", pointsWin: 3 },
      durationDays: 14,
    });
    expect(next.name).toBe("After");
    expect(next.rules.timeControl).toBe("1 day");
    expect(next.rules.pointsWin).toBe(3);
    expect(next.rules.pointsDraw).toBe(t.rules.pointsDraw); // untouched fields survive
    expect(next.durationDays).toBe(14);
    const days = (new Date(next.endDate!).getTime() - new Date(next.startDate!).getTime()) / 86400000;
    expect(Math.round(days)).toBe(14);
    expect(next.matches).toEqual(t.matches);

    // Clearing the deadline removes endDate.
    const open = updateSettings(next, { durationDays: 0 });
    expect(open.endDate).toBeUndefined();
  });
});
