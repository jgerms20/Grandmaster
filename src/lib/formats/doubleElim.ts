import type { Color, Match, Player } from "@/lib/types";
import { nextPow2 } from "@/lib/util";
import { bySeed, mkMatch } from "./helpers";
import { generateSingleElim, seedSlots } from "./singleElim";

/**
 * Double elimination with a single grand final (no bracket reset).
 *
 * Winners bracket plays like single-elim; each loser drops into the losers
 * bracket, which alternates "major" rounds (LB survivors pair off) and "minor"
 * rounds (an LB survivor meets a fresh WB dropout). The last LB survivor meets
 * the WB winner in the grand final. Byes are resolved centrally by normalizeElim.
 */
export function generateDoubleElim(players: readonly Player[]): Match[] {
  const seeded = bySeed(players);
  const n = seeded.length;
  const size = nextPow2(n);
  const k = Math.round(Math.log2(size));
  if (k < 2) return generateSingleElim(players); // 2 players → degenerate

  // --- Winners bracket ---------------------------------------------------
  const wb: Match[][] = [];
  for (let r = 1; r <= k; r++) {
    const count = size / 2 ** r;
    wb.push(
      Array.from({ length: count }, (_, i) =>
        mkMatch({
          round: r,
          order: i,
          bracket: "winners",
          whitePlaceholder: r > 1 ? `Winner WB${r - 1} · #${2 * i + 1}` : undefined,
          blackPlaceholder: r > 1 ? `Winner WB${r - 1} · #${2 * i + 2}` : undefined,
        }),
      ),
    );
  }

  // --- Losers bracket ----------------------------------------------------
  const lbByL = new Map<number, Match[]>();
  const lastL = 2 * (k - 1);
  for (let m = 1; m <= k - 1; m++) {
    const count = size / 2 ** (m + 1);
    const major = 2 * m - 1;
    const minor = 2 * m;
    lbByL.set(
      major,
      Array.from({ length: count }, (_, i) =>
        mkMatch({
          round: major,
          order: i,
          bracket: "losers",
          whitePlaceholder: major === 1 ? `Loser WB1 · #${2 * i + 1}` : `Winner LB${major - 1} · #${2 * i + 1}`,
          blackPlaceholder: major === 1 ? `Loser WB1 · #${2 * i + 2}` : `Winner LB${major - 1} · #${2 * i + 2}`,
        }),
      ),
    );
    lbByL.set(
      minor,
      Array.from({ length: count }, (_, i) =>
        mkMatch({
          round: minor,
          order: i,
          bracket: "losers",
          whitePlaceholder: `Winner LB${minor - 1} · #${i + 1}`,
          blackPlaceholder: `Loser WB${m + 1} · #${i + 1}`,
        }),
      ),
    );
  }

  // --- Grand final -------------------------------------------------------
  const gf = mkMatch({
    round: Math.max(k, lastL) + 1,
    order: 0,
    bracket: "grand_final",
    whitePlaceholder: "Winners bracket champion",
    blackPlaceholder: "Losers bracket champion",
  });

  // --- Wire winners bracket ---------------------------------------------
  for (let r = 0; r < k; r++) {
    wb[r].forEach((mt, i) => {
      if (r < k - 1) {
        mt.winnerTo = { matchId: wb[r + 1][Math.floor(i / 2)].id, slot: i % 2 === 0 ? "white" : "black" };
      } else {
        mt.winnerTo = { matchId: gf.id, slot: "white" };
      }
      // Loser drops to the LB.
      if (r === 0) {
        const target = lbByL.get(1)![Math.floor(i / 2)];
        mt.loserTo = { matchId: target.id, slot: i % 2 === 0 ? "white" : "black" };
      } else {
        const minorL = 2 * r; // consumes WBL[r+1] (1-based round r+1)
        mt.loserTo = { matchId: lbByL.get(minorL)![i].id, slot: "black" };
      }
    });
  }

  // --- Wire losers bracket ----------------------------------------------
  for (let L = 1; L <= lastL; L++) {
    const arr = lbByL.get(L)!;
    arr.forEach((mt, i) => {
      if (L === lastL) {
        mt.winnerTo = { matchId: gf.id, slot: "black" };
      } else if (L % 2 === 1) {
        mt.winnerTo = { matchId: lbByL.get(L + 1)![i].id, slot: "white" };
      } else {
        const slot: Color = i % 2 === 0 ? "white" : "black";
        mt.winnerTo = { matchId: lbByL.get(L + 1)![Math.floor(i / 2)].id, slot };
      }
    });
  }

  // --- Seed WB round 1 ---------------------------------------------------
  const slots = seedSlots(size).map((seed) => (seed <= n ? seeded[seed - 1].id : null));
  wb[0].forEach((mt, i) => {
    mt.whiteId = slots[2 * i];
    mt.blackId = slots[2 * i + 1];
    if (mt.whiteId && mt.blackId === null) {
      mt.status = "bye";
      mt.result = "white";
      mt.blackPlaceholder = "Bye";
    } else if (mt.blackId && mt.whiteId === null) {
      mt.status = "bye";
      mt.result = "black";
      mt.whitePlaceholder = "Bye";
    }
  });

  const lbMatches = Array.from(lbByL.values()).flat();
  return [...wb.flat(), ...lbMatches, gf];
}
