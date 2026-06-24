"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
  Radio,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { Match, MatchResult, Player } from "@/lib/types";
import { chessProfileUrl } from "@/lib/chesscom";
import { MatchClock } from "./Clock";
import { PlayerIdentity } from "./PlayerAvatar";

interface Props {
  match: Match;
  white?: Player | null;
  black?: Player | null;
  label?: string;
  organizer?: boolean;
  onResult?: (id: string, r: MatchResult) => void;
  onLive?: (id: string, live: boolean) => void;
  onMeta?: (id: string, meta: { gameUrl?: string; moves?: number }) => void;
}

function ColorChip({ color }: { color: "white" | "black" }) {
  const isWhite = color === "white";
  return (
    <span
      title={isWhite ? "Plays White" : "Plays Black"}
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] ${
        isWhite ? "border-black/20 bg-[#f0d9b5] text-[#3a2c1d]" : "border-white/15 bg-[#15171c] text-[#f1efe9]"
      }`}
    >
      {isWhite ? "♔" : "♚"}
    </span>
  );
}

function StatusPill({ status }: { status: Match["status"] }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-live">
        <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-live" /> Live
      </span>
    );
  if (status === "done")
    return <span className="chip text-[11px]">Final</span>;
  if (status === "bye")
    return <span className="chip text-[11px] text-gold-200">Bye</span>;
  return <span className="chip text-[11px] text-muted">Upcoming</span>;
}

function ResultMark({ side, result }: { side: "white" | "black"; result: MatchResult }) {
  if (result === side)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-win">
        <Trophy className="h-3.5 w-3.5" /> Won
      </span>
    );
  if (result === "draw") return <span className="text-xs font-semibold text-draw">½</span>;
  if (result && result !== side) return <span className="text-xs text-loss/80">Lost</span>;
  return null;
}

export function MatchCard(props: Props) {
  const { match, white, black, label, organizer } = props;
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(match.gameUrl ?? "");
  const [moves, setMoves] = useState(match.moves?.toString() ?? "");

  if (match.status === "dead") return null;

  const playable =
    (match.status === "pending" || match.status === "live") && !!white && !!black;
  const watchUrl =
    match.gameUrl ||
    chessProfileUrl(white?.chessUsername) ||
    chessProfileUrl(black?.chessUsername);

  const winningSide = match.result;

  return (
    <div
      className={`panel-flat animate-in p-3 transition ${
        match.status === "live" ? "ring-1 ring-live/40" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="label">{label ?? `Round ${match.round}`}</span>
        <div className="flex items-center gap-2">
          <MatchClock startedAt={match.startedAt} endedAt={match.endedAt} status={match.status} />
          <StatusPill status={match.status} />
        </div>
      </div>

      <div className="space-y-1.5">
        {(["white", "black"] as const).map((side) => {
          const player = side === "white" ? white : black;
          const placeholder = side === "white" ? match.whitePlaceholder : match.blackPlaceholder;
          const isWinner = winningSide === side;
          const isLoser = match.status === "done" && winningSide && winningSide !== "draw" && winningSide !== side;
          const canPick = !!(organizer && playable && player);
          return (
            <div
              key={side}
              onClick={canPick ? () => props.onResult?.(match.id, side) : undefined}
              role={canPick ? "button" : undefined}
              title={canPick ? `Advance ${player?.name}` : undefined}
              className={[
                "group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition",
                isWinner ? "bg-win/10 ring-1 ring-win/30" : "bg-ink-900/40",
                canPick ? "cursor-pointer hover:bg-gold-300/10 hover:ring-1 hover:ring-gold-300/40" : "",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-2">
                <ColorChip color={side} />
                <PlayerIdentity
                  player={player}
                  placeholder={placeholder ?? (side === "white" ? "White" : "Black")}
                  size="sm"
                  highlight={isWinner}
                  dim={!!isLoser}
                />
              </div>
              {canPick && !match.result ? (
                <span className="shrink-0 text-[10px] font-semibold text-gold-200 opacity-0 transition group-hover:opacity-100">
                  Advance →
                </span>
              ) : (
                <ResultMark side={side} result={match.result} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] text-muted">
          {match.moves != null && <span>{match.moves} moves</span>}
          {watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-gold-200 hover:text-gold-100"
            >
              <ExternalLink className="h-3 w-3" />
              {match.gameUrl ? "Watch game" : "Chess.com"}
            </a>
          )}
        </div>

        {organizer && match.status !== "bye" && (
          <div className="flex items-center gap-1.5">
            {playable && (
              <>
                {match.status !== "live" && (
                  <button
                    onClick={() => props.onLive?.(match.id, true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-600/70 px-2 py-1 text-[11px] font-semibold text-muted hover:border-live/50 hover:text-live"
                  >
                    <Radio className="h-3 w-3" /> Go live
                  </button>
                )}
                <div className="inline-flex overflow-hidden rounded-lg border border-ink-600/70">
                  <button
                    onClick={() => props.onResult?.(match.id, "white")}
                    title={`${white?.name ?? "White"} wins`}
                    className="px-2 py-1 text-[11px] font-bold text-cream hover:bg-win/20"
                  >
                    1–0
                  </button>
                  <button
                    onClick={() => props.onResult?.(match.id, "draw")}
                    title="Draw"
                    className="border-x border-ink-600/70 px-2 py-1 text-[11px] font-bold text-cream hover:bg-draw/20"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => props.onResult?.(match.id, "black")}
                    title={`${black?.name ?? "Black"} wins`}
                    className="px-2 py-1 text-[11px] font-bold text-cream hover:bg-win/20"
                  >
                    0–1
                  </button>
                </div>
              </>
            )}
            {match.status === "done" && (
              <button
                onClick={() => props.onResult?.(match.id, null)}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-600/70 px-2 py-1 text-[11px] text-muted hover:border-gold-300/50 hover:text-gold-200"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-7 w-7 place-items-center rounded-lg border border-ink-600/70 text-muted hover:text-cream"
              title="Game details"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {organizer && open && (
        <div className="mt-2.5 grid gap-2 border-t border-ink-700/60 pt-2.5 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-1.5 rounded-lg border border-ink-600/70 bg-ink-900/60 px-2">
            <Link2 className="h-3.5 w-3.5 text-muted" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Chess.com game URL"
              className="w-full bg-transparent py-1.5 text-xs text-cream placeholder:text-muted/60 focus:outline-none"
            />
          </div>
          <input
            value={moves}
            onChange={(e) => setMoves(e.target.value.replace(/\D/g, ""))}
            placeholder="moves"
            className="w-20 rounded-lg border border-ink-600/70 bg-ink-900/60 px-2 py-1.5 text-xs text-cream placeholder:text-muted/60 focus:outline-none"
          />
          <button
            onClick={() =>
              props.onMeta?.(match.id, {
                gameUrl: url.trim(),
                moves: moves ? Number(moves) : undefined,
              })
            }
            className="btn-subtle px-3 py-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      )}
    </div>
  );
}
