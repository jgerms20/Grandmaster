"use client";

import { Fragment } from "react";
import type { Match, MatchResult, Player } from "@/lib/types";
import { MatchCard } from "./MatchCard";

export interface BracketHandlers {
  organizer?: boolean;
  onResult?: (id: string, r: MatchResult) => void;
  onLive?: (id: string, live: boolean) => void;
  onMeta?: (id: string, meta: { gameUrl?: string; moves?: number }) => void;
  onSync?: (id: string) => Promise<string | null>;
}

function groupByRound(matches: Match[]): Map<number, Match[]> {
  const map = new Map<number, Match[]>();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
  return map;
}

export function singleElimLabel(round: number, total: number): string {
  const fromEnd = total - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}

/**
 * Connector rail drawn between two bracket columns.
 *
 * Alignment relies on every column's cells being `flex-1` inside equal-height
 * columns: cell k of an N-cell column is centered at the same y as the pair
 * (2k, 2k+1) of a 2N-cell column, so a half-height ⊐ box lines up exactly with
 * the two feeder cards. `type="straight"` is for 1:1 rounds (losers-bracket
 * minor rounds).
 */
function ConnectorColumn({ count, type }: { count: number; type: "merge" | "straight" }) {
  return (
    <div className="connector flex w-7 flex-1 shrink-0 flex-col" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative flex flex-1 items-center">
          {type === "merge" ? (
            <div className="h-1/2 w-full rounded-r-lg border-y-2 border-r-2 border-ink-600/70" />
          ) : (
            <div className="h-0.5 w-full bg-ink-600/70" />
          )}
        </div>
      ))}
    </div>
  );
}

export function BracketColumns({
  matches,
  players,
  labelOf,
  handlers,
}: {
  matches: Match[];
  players: Map<string, Player>;
  labelOf: (round: number, total: number) => string;
  handlers: BracketHandlers;
}) {
  // Keep dead matches: they render as invisible placeholders so the flex
  // geometry (and therefore the connector alignment) stays exact.
  const grouped = groupByRound(matches);
  const rounds = [...grouped.keys()].sort((a, b) => a - b);
  if (rounds.length === 0) return null;
  const total = rounds[rounds.length - 1];

  return (
    <div className="flex items-stretch overflow-x-auto pb-3">
      {rounds.map((r, i) => {
        const ms = grouped.get(r)!;
        const next = i < rounds.length - 1 ? grouped.get(rounds[i + 1])! : null;
        const ratio = next ? ms.length / next.length : 0;
        const connector: "merge" | "straight" | null =
          ratio === 2 ? "merge" : ratio === 1 ? "straight" : null;

        return (
          <Fragment key={r}>
            <div className="flex w-[264px] shrink-0 flex-col">
              <div className="label mb-3 border-b border-ink-800/70 pb-2">{labelOf(r, total)}</div>
              <div className="flex flex-1 flex-col">
                {ms.map((m) => (
                  <div key={m.id} className="flex min-h-[128px] flex-1 items-center py-1.5">
                    {m.status === "dead" ? (
                      <div className="w-full" aria-hidden />
                    ) : (
                      <div className="w-full">
                        <MatchCard
                          match={m}
                          white={m.whiteId ? players.get(m.whiteId) : null}
                          black={m.blackId ? players.get(m.blackId) : null}
                          label={`#${m.order + 1}`}
                          organizer={handlers.organizer}
                          onResult={handlers.onResult}
                          onLive={handlers.onLive}
                          onMeta={handlers.onMeta}
                          onSync={handlers.onSync}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {next && connector && (
              <div className="flex flex-col">
                {/* spacer matching the round label height so rails align with cards */}
                <div className="label mb-3 select-none border-b border-transparent pb-2">&nbsp;</div>
                <div className="flex flex-1 flex-col">
                  <ConnectorColumn count={next.length} type={connector} />
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
