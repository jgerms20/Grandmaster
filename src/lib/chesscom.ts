// Client for the Chess.com public, read-only API.
// https://www.chess.com/news/view/published-data-api
//
// Called directly from the browser (the API sends permissive CORS headers), so
// the app stays fully static and can be hosted on GitHub Pages. Results are
// cached in-memory for the session to avoid refetching the same handle.

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
}

function countryCode(url?: string): string | undefined {
  if (!url) return undefined;
  const code = url.split("/").pop();
  return code && code.length === 2 ? code.toUpperCase() : undefined;
}

const cache = new Map<string, ChessInfo>();

/** Look up a player's public profile + ratings. Never throws — returns found:false. */
export async function lookupChessInfo(raw: string): Promise<ChessInfo> {
  const username = raw.trim().toLowerCase();
  if (!username) return { username: raw, found: false };
  const cached = cache.get(username);
  if (cached) return cached;

  try {
    const headers = { Accept: "application/json" };
    const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`, { headers });
    if (!profileRes.ok) {
      const miss = { username, found: false };
      cache.set(username, miss);
      return miss;
    }
    const profile = (await profileRes.json()) as Record<string, unknown>;

    let ratings: ChessInfo["ratings"] = {};
    try {
      const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`, { headers });
      if (statsRes.ok) {
        const s = (await statsRes.json()) as any;
        ratings = {
          rapid: s?.chess_rapid?.last?.rating,
          blitz: s?.chess_blitz?.last?.rating,
          bullet: s?.chess_bullet?.last?.rating,
        };
      }
    } catch {
      /* ratings are best-effort */
    }

    const info: ChessInfo = {
      username,
      found: true,
      name: (profile.name as string) || undefined,
      avatarUrl: (profile.avatar as string) || undefined,
      title: (profile.title as string) || undefined,
      countryCode: countryCode(profile.country as string),
      profileUrl: (profile.url as string) || `https://www.chess.com/member/${username}`,
      rating: ratings.rapid ?? ratings.blitz ?? ratings.bullet,
      ratings,
    };
    cache.set(username, info);
    return info;
  } catch {
    return { username, found: false };
  }
}

/** Build a sensible Chess.com profile link for a player. */
export function chessProfileUrl(username?: string): string | undefined {
  return username ? `https://www.chess.com/member/${username.trim().toLowerCase()}` : undefined;
}
