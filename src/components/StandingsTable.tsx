import { Crown } from "lucide-react";
import type { Player, Tournament } from "@/lib/types";
import { computeStandings } from "@/lib/formats";
import { PlayerIdentity } from "./PlayerAvatar";

export function StandingsTable({ tournament }: { tournament: Tournament }) {
  const rows = computeStandings(tournament);
  const byId = new Map<string, Player>(tournament.players.map((p) => [p.id, p]));
  const leaderPoints = rows[0]?.points ?? 0;

  return (
    <div className="panel overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-700/70 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            <th className="px-3 py-2.5 font-semibold">#</th>
            <th className="px-2 py-2.5 font-semibold">Player</th>
            <th className="px-2 py-2.5 text-center font-semibold">P</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">W</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">D</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">L</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold md:table-cell" title="Colors played (white/black)">
              ♔/♚
            </th>
            <th className="px-3 py-2.5 text-right font-semibold">Pts</th>
            <th className="hidden px-3 py-2.5 text-right font-semibold md:table-cell" title="Sonneborn–Berger tiebreak">
              TB
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const player = byId.get(r.playerId);
            const isChamp = tournament.status === "complete" && tournament.championId === r.playerId;
            const leading = tournament.status !== "complete" && r.points === leaderPoints && r.points > 0;
            return (
              <tr
                key={r.playerId}
                className={`border-b border-ink-800/60 last:border-0 ${
                  isChamp ? "bg-gold-500/10" : leading ? "bg-ink-700/25" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${
                      r.rank === 1 ? "bg-gold-sheen text-ink-950" : "bg-ink-700/70 text-muted"
                    }`}
                  >
                    {r.rank}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <PlayerIdentity player={player} size="sm" highlight={isChamp} />
                    {isChamp && <Crown className="h-4 w-4 text-gold-300" />}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-muted">{r.played}</td>
                <td className="hidden px-2 py-2.5 text-center text-win sm:table-cell">{r.wins}</td>
                <td className="hidden px-2 py-2.5 text-center text-draw sm:table-cell">{r.draws}</td>
                <td className="hidden px-2 py-2.5 text-center text-loss/90 sm:table-cell">{r.losses}</td>
                <td className="hidden px-2 py-2.5 text-center font-mono text-xs text-muted md:table-cell">
                  {r.whites}/{r.blacks}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-base font-bold text-gold-100">
                  {r.points}
                </td>
                <td className="hidden px-3 py-2.5 text-right font-mono text-xs text-muted md:table-cell">
                  {r.tiebreak.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
