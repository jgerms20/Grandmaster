// Thin client for the Chess.com public, read-only API.
// https://www.chess.com/news/view/published-data-api

export interface ChessInfo {
  username: string;
  found: boolean;
  name?: string;
  avatarUrl?: string;
  title?: string;
  countryCode?: string;
  profileUrl?: string;
  /** Best available rating (rapid ▸ blitz ▸ bullet). */
  rating?: number;
  ratings?: { rapid?: number; blitz?: number; bullet?: number };
  online?: boolean;
}

const UA = "Grandmaster tournament hub (https://github.com/jgerms20/grandmaster)";

function countryCode(url?: string): string | undefined {
  if (!url) return undefined;
  const code = url.split("/").pop();
  return code && code.length === 2 ? code.toUpperCase() : undefined;
}

/** Server-side fetch + normalize. Never throws — returns found:false instead. */
export async function fetchChessProfile(rawUsername: string): Promise<ChessInfo> {
  const username = rawUsername.trim().toLowerCase();
  if (!username) return { username: rawUsername, found: false };

  try {
    const headers = { "User-Agent": UA, Accept: "application/json" };
    const opts = { headers, next: { revalidate: 1800 } } as RequestInit;
    const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`, opts);
    if (!profileRes.ok) return { username, found: false };
    const profile = (await profileRes.json()) as Record<string, unknown>;

    let ratings: ChessInfo["ratings"] = {};
    try {
      const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`, opts);
      if (statsRes.ok) {
        const s = (await statsRes.json()) as any;
        ratings = {
          rapid: s?.chess_rapid?.last?.rating,
          blitz: s?.chess_blitz?.last?.rating,
          bullet: s?.chess_bullet?.last?.rating,
        };
      }
    } catch {
      /* stats are best-effort */
    }

    const rating = ratings.rapid ?? ratings.blitz ?? ratings.bullet;
    return {
      username,
      found: true,
      name: (profile.name as string) || undefined,
      avatarUrl: (profile.avatar as string) || undefined,
      title: (profile.title as string) || undefined,
      countryCode: countryCode(profile.country as string),
      profileUrl: (profile.url as string) || `https://www.chess.com/member/${username}`,
      rating,
      ratings,
    };
  } catch {
    return { username, found: false };
  }
}

/** Client-side helper — calls our own cached proxy route. */
export async function lookupChessInfo(username: string): Promise<ChessInfo> {
  const res = await fetch(`/api/chesscom/${encodeURIComponent(username)}`);
  if (!res.ok) return { username, found: false };
  return (await res.json()) as ChessInfo;
}

/** Build a sensible Chess.com link for a player (profile fallback). */
export function chessProfileUrl(username?: string): string | undefined {
  return username ? `https://www.chess.com/member/${username.trim().toLowerCase()}` : undefined;
}
