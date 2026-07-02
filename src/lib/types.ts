// ---------------------------------------------------------------------------
// Grandmaster domain model
//
// A single embedded model powers every tournament format. Matches always carry
// an explicit white/black assignment (so "who had which color last round" is
// never ambiguous), plus optional Chess.com + timing metadata.
// ---------------------------------------------------------------------------

export type Format = "round_robin" | "single_elim" | "double_elim" | "swiss";

export const FORMAT_LABELS: Record<Format, string> = {
  round_robin: "Round Robin",
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  swiss: "Swiss",
};

export const FORMAT_BLURBS: Record<Format, string> = {
  round_robin: "Everyone plays everyone. Ranked by points.",
  single_elim: "Lose once and you're out. Classic knockout bracket.",
  double_elim: "A loss drops you to the lower bracket — you're out after two.",
  swiss: "Paired against someone on your score each round. No eliminations.",
};

export type Color = "white" | "black";

/** A competitor. Chess.com fields are hydrated lazily from the public API. */
export interface Player {
  id: string;
  name: string;
  chessUsername?: string;
  seed: number;
  // Hydrated from Chess.com (optional, cached on the player):
  avatarUrl?: string;
  rating?: number;
  title?: string;
  countryCode?: string;
  profileUrl?: string;
}

export type MatchStatus = "pending" | "live" | "done" | "bye" | "dead";

/** Winner of a decided game, a draw, or undecided (null). */
export type MatchResult = Color | "draw" | null;

export type BracketSide = "winners" | "losers" | "grand_final";

export interface Match {
  id: string;
  round: number; // 1-based
  /** Display order within the round (top-to-bottom in a bracket). */
  order: number;
  bracket?: BracketSide; // elimination formats only

  whiteId: string | null;
  blackId: string | null;

  status: MatchStatus;
  result: MatchResult;

  // Chess.com / live metadata
  gameUrl?: string;
  startedAt?: string; // ISO
  endedAt?: string; // ISO
  moves?: number;
  /** For live daily games: which side (in OUR color assignment) is to move. */
  turn?: Color;

  // Bracket wiring (elimination formats): where the winner / loser flows next.
  winnerTo?: { matchId: string; slot: Color } | null;
  loserTo?: { matchId: string; slot: Color } | null;

  /** Label shown before players are known, e.g. "Winner of QF1" or "Bye". */
  whitePlaceholder?: string;
  blackPlaceholder?: string;
}

export interface Rules {
  timeControl: string; // e.g. "10|0", "5|3", "30|0"
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  /** Replay a drawn game instead of splitting the point. */
  rematchOnDraw: boolean;
  /** Human-readable tiebreak description shown to players. */
  tiebreak: string;
  /** Free-text "describe your own rules" box. */
  description: string;
}

export type TournamentStatus = "setup" | "active" | "complete";

export interface Tournament {
  id: string;
  name: string;
  format: Format;
  status: TournamentStatus;
  players: Player[];
  matches: Match[];
  rules: Rules;
  /** Planned number of rounds (Swiss). 0 = auto. */
  plannedRounds: number;
  currentRound: number;
  championId?: string | null;
  /** ISO date the tournament started. */
  startDate?: string;
  /** ISO deadline by which it should wrap up (0-duration = open-ended). */
  endDate?: string;
  /** Intended length in days (0 = no deadline). */
  durationDays?: number;
  /** Round robin only: 1 = single, 2 = double (colors reversed). */
  cycles?: number;
  createdAt: string;
  updatedAt: string;
  /** Lightweight edit gate — anyone with the code can run the tournament. */
  adminCode: string;
}

// ---------------------------------------------------------------------------
// Standings (computed, never stored)
// ---------------------------------------------------------------------------

export interface StandingRow {
  playerId: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  whites: number;
  blacks: number;
  /** Sonneborn–Berger style tiebreak (sum of defeated/drawn opponents' scores). */
  tiebreak: number;
  /** True once the player can no longer be caught / is eliminated. */
  eliminated?: boolean;
}
