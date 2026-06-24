import type { Player } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function flagEmoji(code?: string): string {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0) - 65),
  );
}

const SIZES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({
  player,
  size = "md",
}: {
  player?: Player | null;
  size?: keyof typeof SIZES;
}) {
  const cls = `relative shrink-0 overflow-hidden rounded-lg border border-ink-600/70 bg-ink-700 ${SIZES[size]}`;
  if (player?.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={player.avatarUrl} alt={player.name} className={cls} loading="lazy" />;
  }
  return (
    <span className={`${cls} grid place-items-center font-semibold text-muted`}>
      {player ? initials(player.name) : "?"}
    </span>
  );
}

export function TitleTag({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <span className="rounded bg-gold-sheen px-1 py-0.5 text-[9px] font-bold leading-none text-ink-950">
      {title}
    </span>
  );
}

/** Full identity row: avatar + name + title + flag + rating. */
export function PlayerIdentity({
  player,
  placeholder,
  size = "md",
  highlight,
  dim,
}: {
  player?: Player | null;
  placeholder?: string;
  size?: keyof typeof SIZES;
  highlight?: boolean;
  dim?: boolean;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2.5 text-muted/80">
        <span className={`${SIZES[size]} grid place-items-center rounded-lg border border-dashed border-ink-600/70`}>
          ?
        </span>
        <span className="truncate text-sm italic">{placeholder ?? "To be decided"}</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-2.5 ${dim ? "opacity-55" : ""}`}>
      <Avatar player={player} size={size} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`truncate font-semibold ${highlight ? "text-gold-200" : "text-cream"}`}>
            {player.name}
          </span>
          <TitleTag title={player.title} />
          {player.countryCode && <span className="text-xs leading-none">{flagEmoji(player.countryCode)}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          {player.chessUsername && <span className="truncate">@{player.chessUsername}</span>}
          {player.rating != null && (
            <span className="font-mono text-gold-200/90">{player.rating}</span>
          )}
        </div>
      </div>
    </div>
  );
}
