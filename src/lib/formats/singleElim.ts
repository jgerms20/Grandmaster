import type { Color, Match, Player } from "@/lib/types";
import { nextPow2 } from "@/lib/util";
import { bySeed, mkMatch } from "./helpers";

/**
 * Standard bracket seed order for a bracket of `size` (a power of two).
 * e.g. size 8 → [1,8,5,4,3,6,7,2] so #1 and #2 can only meet in the final.
 */
export function seedSlots(size: number): number[] {
  let slots = [1, 2];
  while (slots.length < size) {
    const sum = slots.length * 2 + 1;
    const next: number[] = [];
    for (const s of slots) {
      next.push(s);
      next.push(sum - s);
    }
    slots = next;
  }
  return slots;
}

/** Top slot takes White; winner flows to the next round (top/bottom by parity). */
export function generateSingleElim(players: readonly Player[]): Match[] {
  const seeded = bySeed(players);
  const n = seeded.length;
  if (n < 2) return [];

  const size = nextPow2(n);
  const rounds = Math.round(Math.log2(size));
  const slots = seedSlots(size).map((seed) => (seed <= n ? seeded[seed - 1].id : null));

  // Build empty matches per round so we can wire winner pointers.
  const byRound: Match[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    const row: Match[] = [];
    for (let i = 0; i < count; i++) {
      row.push(
        mkMatch({
          round: r,
          order: i,
          bracket: "winners",
          whitePlaceholder: r > 1 ? `Winner R${r - 1} · #${2 * i + 1}` : undefined,
          blackPlaceholder: r > 1 ? `Winner R${r - 1} · #${2 * i + 2}` : undefined,
        }),
      );
    }
    byRound.push(row);
  }

  // Wire winners forward.
  for (let r = 0; r < rounds - 1; r++) {
    byRound[r].forEach((m, i) => {
      const slot: Color = i % 2 === 0 ? "white" : "black";
      m.winnerTo = { matchId: byRound[r + 1][Math.floor(i / 2)].id, slot };
    });
  }

  // Seed round 1.
  byRound[0].forEach((m, i) => {
    m.whiteId = slots[2 * i];
    m.blackId = slots[2 * i + 1];
    if (m.whiteId && m.blackId === null) {
      m.status = "bye";
      m.result = "white";
      m.blackPlaceholder = "Bye";
    } else if (m.blackId && m.whiteId === null) {
      m.status = "bye";
      m.result = "black";
      m.whitePlaceholder = "Bye";
    }
  });

  // Byes are propagated centrally via normalizeElim() at init time.
  return byRound.flat();
}
