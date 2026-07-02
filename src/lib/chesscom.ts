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

/** Accept a raw username, an @handle, or a full Chess.com profile URL. */
export function parseChessHandle(input: string): string {
  const s = input.trim();
  const m = s.match(/chess\.com\/(?:member|members|player|@)?\/?([^/?#\s]+)/i);
  if (m && m[1] && m[1] !== "member") return m[1];
  return s.replace(/^@/, "");
}

/** Link that opens a new Chess.com challenge against `opponent`. */
export function challengeUrl(opponent?: string): string | undefined {
  return opponent
    ? `https://www.chess.com/play/online/new?opponent=${encodeURIComponent(opponent.trim().toLowerCase())}`
    : undefined;
}

// ---------------------------------------------------------------------------
// Game detection — find the actual game between two players.
// Pure helpers are exported for tests; network calls never throw.
// ---------------------------------------------------------------------------

const API = "https://api.chess.com/pub";
const JSON_HEADERS = { Accept: "application/json" };

/** Chess.com embeds player API URLs like .../pub/player/hikaru — take the tail. */
export function usernameFromApiUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  return url.split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
}

/** Completed half-moves from a FEN (fullmove counter + side to move). */
export function pliesFromFen(fen?: string): number | undefined {
  if (!fen) return undefined;
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 6) return undefined;
  const fullmove = Number(parts[5]);
  if (!Number.isFinite(fullmove) || fullmove < 1) return undefined;
  return (fullmove - 1) * 2 + (parts[1] === "b" ? 1 : 0);
}

const DRAW_CODES = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

/** Map an archive game's result codes to a winner ("white"/"black"/"draw"), or null if void. */
export function classifyArchiveGame(g: {
  white?: { result?: string };
  black?: { result?: string };
}): "white" | "black" | "draw" | null {
  if (g?.white?.result === "win") return "white";
  if (g?.black?.result === "win") return "black";
  if (g?.white?.result && DRAW_CODES.has(g.white.result)) return "draw";
  return null; // aborted / unknown
}

export interface DailyGame {
  url: string;
  /** Side to move in the Chess.com game's own colors. */
  turn: "white" | "black";
  moves?: number;
  whiteUsername: string;
  blackUsername: string;
}

/** Find the ongoing daily game between two players, if one exists. */
export async function findCurrentDailyGame(
  userA: string,
  userB: string,
): Promise<DailyGame | null> {
  const a = userA.trim().toLowerCase();
  const b = userB.trim().toLowerCase();
  if (!a || !b) return null;
  try {
    const res = await fetch(`${API}/player/${a}/games`, { headers: JSON_HEADERS });
    if (!res.ok) return null;
    const data = (await res.json()) as { games?: Array<Record<string, unknown>> };
    for (const g of data.games ?? []) {
      const w = usernameFromApiUrl(g.white);
      const bl = usernameFromApiUrl(g.black);
      const isPair = (w === a && bl === b) || (w === b && bl === a);
      if (!isPair || typeof g.url !== "string") continue;
      return {
        url: g.url,
        turn: g.turn === "black" ? "black" : "white",
        moves: pliesFromFen(typeof g.fen === "string" ? g.fen : undefined),
        whiteUsername: w,
        blackUsername: bl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export interface FinishedGame {
  url: string;
  endTimeMs: number;
  moves?: number;
  whiteUsername: string;
  blackUsername: string;
  /** Winner in the Chess.com game's own colors. */
  result: "white" | "black" | "draw";
}

function monthUrl(user: string, d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${API}/player/${user}/games/${y}/${m}`;
}

/**
 * Find the most recent finished game between two players since `sinceMs`,
 * searching this month's and last month's archives.
 */
export async function findRecentFinishedGame(
  userA: string,
  userB: string,
  sinceMs: number,
): Promise<FinishedGame | null> {
  const a = userA.trim().toLowerCase();
  const b = userB.trim().toLowerCase();
  if (!a || !b) return null;

  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  let best: FinishedGame | null = null;

  for (const url of [monthUrl(a, now), monthUrl(a, prev)]) {
    try {
      const res = await fetch(url, { headers: JSON_HEADERS });
      if (!res.ok) continue;
      const data = (await res.json()) as { games?: Array<Record<string, any>> };
      for (const g of data.games ?? []) {
        const w = String(g?.white?.username ?? "").toLowerCase();
        const bl = String(g?.black?.username ?? "").toLowerCase();
        const isPair = (w === a && bl === b) || (w === b && bl === a);
        if (!isPair) continue;
        const endMs = Number(g?.end_time) * 1000;
        if (!Number.isFinite(endMs) || endMs < sinceMs) continue;
        const result = classifyArchiveGame(g);
        if (!result) continue;
        if (!best || endMs > best.endTimeMs) {
          best = {
            url: typeof g.url === "string" ? g.url : "",
            endTimeMs: endMs,
            moves: pliesFromFen(typeof g.fen === "string" ? g.fen : undefined),
            whiteUsername: w,
            blackUsername: bl,
            result,
          };
        }
      }
    } catch {
      /* keep looking */
    }
  }
  return best;
}
