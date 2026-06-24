"use client";

import type { Match, MatchResult, Player } from "@/lib/types";
import { MatchCard } from "./MatchCard";

export interface BracketHandlers {
  organizer?: boolean;
  onResult?: (id: string, r: MatchResult) => void;
  onLive?: (id: string, live: boolean) => void;
  onMeta?: (id: string, meta: { gameUrl?: string; moves?: number }) => void;
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
  const grouped = groupByRound(matches.filter((m) => m.status !== "dead"));
  const rounds = [...grouped.keys()].sort((a, b) => a - b);
  if (rounds.length === 0) return null;
  const total = rounds[rounds.length - 1];

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {rounds.map((r) => (
        <div key={r} className="flex min-w-[268px] flex-1 flex-col">
          <div className="label mb-3 border-b border-ink-800/70 pb-2">{labelOf(r, total)}</div>
          <div className="flex flex-1 flex-col justify-center gap-3">
            {grouped.get(r)!.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                white={m.whiteId ? players.get(m.whiteId) : null}
                black={m.blackId ? players.get(m.blackId) : null}
                label={`#${m.order + 1}`}
                organizer={handlers.organizer}
                onResult={handlers.onResult}
                onLive={handlers.onLive}
                onMeta={handlers.onMeta}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
