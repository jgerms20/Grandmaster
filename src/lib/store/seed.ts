"use client";

import { lookupChessInfo } from "@/lib/chesscom";
import { createTournament, setMatchLive, setMatchMeta, setMatchResult } from "@/lib/formats";
import type { Tournament } from "@/lib/types";
import { getStore } from "./index";

const ROSTER = [
  { name: "Hikaru N.", chessUsername: "hikaru" },
  { name: "Daniel N.", chessUsername: "danielnaroditsky" },
  { name: "Anna C.", chessUsername: "annacramling" },
  { name: "Levy R.", chessUsername: "gothamchess" },
  { name: "Nihal S.", chessUsername: "nihalsarin" },
  { name: "Fabiano C.", chessUsername: "fabianocaruana" },
];

async function hydrate(t: Tournament): Promise<void> {
  await Promise.all(
    t.players.map(async (p) => {
      if (!p.chessUsername) return;
      const info = await lookupChessInfo(p.chessUsername);
      if (!info.found) return;
      p.avatarUrl = info.avatarUrl;
      p.rating = info.rating;
      p.title = info.title;
      p.countryCode = info.countryCode;
      p.profileUrl = info.profileUrl;
    }),
  );
}

/** One-time, local-only demo so the app looks alive on first visit. */
export async function seedDemoIfEmpty(): Promise<void> {
  const store = getStore();
  if (store.kind !== "local") return;
  const existing = await store.list();
  if (existing.length > 0) return;

  let t = createTournament({
    name: "Friday Night Arena",
    format: "round_robin",
    players: ROSTER,
    rules: {
      timeControl: "10|0",
      description:
        "Casual office championship. Winner picks next week's theme. More than 10 minutes late and you forfeit the round.",
    },
  });
  await hydrate(t);

  const r1 = t.matches.filter((m) => m.round === 1 && m.blackId);
  if (r1[0]) t = setMatchResult(t, r1[0].id, "white", { moves: 41 });
  if (r1[1]) t = setMatchResult(t, r1[1].id, "draw", { moves: 30 });
  if (r1[2]) {
    t = setMatchLive(t, r1[2].id, true);
    t = setMatchMeta(t, r1[2].id, { moves: 18, gameUrl: "https://www.chess.com/play" });
  }

  await store.save(t);
}
