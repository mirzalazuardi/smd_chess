export interface Player {
  id: string;
  full_name: string;
  chess_rating: number;
  score: number;
  opponentIds: string[];
  lastColor: "W" | "B" | null;
  hadBye: boolean;
}

export interface Pairing {
  white: Player;
  black: Player | null;
}

export interface MatchResult {
  roundId: string;
  playerId: string;
  score: number;
}

export interface StandingsEntry {
  rank: number;
  playerId: string;
  fullName: string;
  score: number;
  buchholz: number;
  wins: number;
  draws: number;
  losses: number;
}
