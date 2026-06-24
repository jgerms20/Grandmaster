import type { Match, Player } from "@/lib/types";
import { bySeed, mkMatch } from "./helpers";

const BYE = "__bye__";

/**
 * Round-robin pairings via the circle method.
 *
 * Returns one array of [whiteId, blackId] pairs per round. With an odd number
 * of players a phantom "bye" is added; the paired player simply sits out.
 * Colors alternate by (round + board) parity for a fair-ish white/black split.
 */
export function roundRobinPairings(
  playerIds: readonly string[],
): Array<Array<{ white: string; black: string | null }>> {
  const ids = playerIds.slice();
  if (ids.length % 2 === 1) ids.push(BYE);
  const n = ids.length;
  if (n < 2) return [];

  const half = n / 2;
  let arr = ids.slice();
  const rounds: Array<Array<{ white: string; black: string | null }>> = [];

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<{ white: string; black: string | null }> = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE || b === BYE) {
        pairs.push({ white: a === BYE ? b : a, black: null });
        continue;
      }
      const aWhite = (r + i) % 2 === 0;
      pairs.push(aWhite ? { white: a, black: b } : { white: b, black: a });
    }
    rounds.push(pairs);
    // Rotate everyone but the first element.
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return rounds;
}

export function generateRoundRobin(players: readonly Player[]): Match[] {
  const ids = bySeed(players).map((p) => p.id);
  const rounds = roundRobinPairings(ids);
  const matches: Match[] = [];
  rounds.forEach((pairs, r) => {
    pairs.forEach((pair, i) => {
      if (pair.black === null) {
        // Sit-out bye in round robin: no points awarded.
        matches.push(
          mkMatch({
            round: r + 1,
            order: i,
            whiteId: pair.white,
            blackId: null,
            status: "bye",
            blackPlaceholder: "Bye (sits out)",
          }),
        );
      } else {
        matches.push(
          mkMatch({ round: r + 1, order: i, whiteId: pair.white, blackId: pair.black }),
        );
      }
    });
  });
  return matches;
}
