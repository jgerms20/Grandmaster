"use client";

import { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";
import type { MatchStatus } from "@/lib/types";
import { formatElapsed } from "@/lib/util";

/** Ticks once a second while a game is live; otherwise shows final duration. */
export function MatchClock({
  startedAt,
  endedAt,
  status,
}: {
  startedAt?: string;
  endedAt?: string;
  status: MatchStatus;
}) {
  const [, force] = useState(0);
  const live = status === "live";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  if (!startedAt) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${live ? "text-live" : "text-muted"}`}>
      <ClockIcon className="h-3 w-3" />
      {formatElapsed(startedAt, live ? undefined : endedAt)}
    </span>
  );
}
