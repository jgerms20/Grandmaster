"use client";

import { useCallback, useEffect } from "react";
import { AlertCircle, Check, Loader2, Plus, X } from "lucide-react";
import type { ChessInfo } from "@/lib/chesscom";
import { lookupChessInfo, parseChessHandle } from "@/lib/chesscom";
import { flagEmoji } from "@/components/PlayerAvatar";
import { titleCase, uid } from "@/lib/util";

export interface PlayerDraft {
  id: string;
  name: string;
  chessUsername: string;
  info?: ChessInfo;
  status: "idle" | "loading" | "found" | "notfound";
}

export function emptyPlayer(): PlayerDraft {
  return { id: uid("d"), name: "", chessUsername: "", status: "idle" };
}

function ChessPreview({ player }: { player: PlayerDraft }) {
  if (player.status === "loading")
    return <Loader2 className="h-4 w-4 animate-spin text-muted" />;
  if (player.status === "notfound")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-loss/80" title="No Chess.com player with that username">
        <AlertCircle className="h-3.5 w-3.5" /> not found
      </span>
    );
  if (player.status === "found" && player.info?.found)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900/60 px-1.5 py-1">
        {player.info.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.info.avatarUrl} alt="" className="h-5 w-5 rounded" />
        ) : (
          <Check className="h-3.5 w-3.5 text-win" />
        )}
        {player.info.title && (
          <span className="rounded bg-gold-sheen px-1 text-[9px] font-bold text-onaccent">{player.info.title}</span>
        )}
        {player.info.rating != null && (
          <span className="font-mono text-[11px] text-gold-200">{player.info.rating}</span>
        )}
        {player.info.countryCode && <span className="text-[11px]">{flagEmoji(player.info.countryCode)}</span>}
      </span>
    );
  return null;
}

function Row({
  index,
  player,
  canRemove,
  onPatch,
  onRemove,
}: {
  index: number;
  player: PlayerDraft;
  canRemove: boolean;
  onPatch: (id: string, patch: Partial<PlayerDraft>) => void;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const u = player.chessUsername.trim();
    if (!u) return;
    let active = true;
    const handle = setTimeout(async () => {
      const info = await lookupChessInfo(parseChessHandle(u));
      if (active) onPatch(player.id, { info, status: info.found ? "found" : "notfound" });
    }, 550);
    return () => {
      active = false;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.chessUsername]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink-700/60 bg-ink-900/40 p-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-700/70 text-xs font-bold text-muted">
        {index + 1}
      </span>
      <input
        value={player.name}
        onChange={(e) => onPatch(player.id, { name: e.target.value })}
        onBlur={() => player.name && onPatch(player.id, { name: titleCase(player.name) })}
        placeholder={`Player ${index + 1} name`}
        className="min-w-0 flex-1 bg-transparent px-1 text-sm text-cream placeholder:text-muted/60 focus:outline-none"
      />
      <div className="hidden h-5 w-px bg-ink-700/70 sm:block" />
      <div className="flex items-center gap-2">
        <input
          value={player.chessUsername}
          onChange={(e) =>
            onPatch(player.id, {
              chessUsername: e.target.value,
              info: undefined,
              status: e.target.value.trim() ? "loading" : "idle",
            })
          }
          onBlur={() =>
            player.chessUsername && onPatch(player.id, { chessUsername: parseChessHandle(player.chessUsername) })
          }
          placeholder="chess.com user or link"
          className="w-32 bg-transparent px-1 text-sm text-gold-100/90 placeholder:text-muted/50 focus:outline-none sm:w-40"
        />
        <div className="w-24 shrink-0 text-right">
          <ChessPreview player={player} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(player.id)}
        disabled={!canRemove}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:text-loss disabled:opacity-30"
        title="Remove player"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PlayerEditor({
  players,
  onChange,
}: {
  players: PlayerDraft[];
  onChange: (next: PlayerDraft[]) => void;
}) {
  const patch = useCallback(
    (id: string, p: Partial<PlayerDraft>) =>
      onChange(players.map((pl) => (pl.id === id ? { ...pl, ...p } : pl))),
    [players, onChange],
  );
  const remove = (id: string) => onChange(players.filter((p) => p.id !== id));
  const add = () => onChange([...players, emptyPlayer()]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="field-label mb-0">
          {players.length} player{players.length === 1 ? "" : "s"}
        </span>
        <span className="text-[11px] text-muted">Chess.com username is optional — it adds avatars &amp; ratings</span>
      </div>
      <div className="space-y-2">
        {players.map((p, i) => (
          <Row
            key={p.id}
            index={i}
            player={p}
            canRemove={players.length > 2}
            onPatch={patch}
            onRemove={remove}
          />
        ))}
      </div>
      <button type="button" onClick={add} className="btn-ghost w-full border-dashed text-sm">
        <Plus className="h-4 w-4" /> Add player
      </button>
    </div>
  );
}
