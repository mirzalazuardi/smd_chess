import type { Player } from "./types";

export function buildPlayerHistory(
  registrations: Array<{
    id: string;
    full_name: string;
    chess_rating: number | null;
  }>,
  priorRounds: Array<{
    id: string;
    round_number: number;
    matches: Array<{
      player1_id: string;
      player2_id: string | null;
      player1_score: number | null;
      player2_score: number | null;
    }>;
  }>,
): Map<string, Player> {
  const scores = new Map<string, number>();
  const opponents = new Map<string, string[]>();
  const lastColor = new Map<string, "W" | "B" | null>();
  const hadBye = new Map<string, boolean>();

  for (const reg of registrations) {
    scores.set(reg.id, 0);
    opponents.set(reg.id, []);
    lastColor.set(reg.id, null);
    hadBye.set(reg.id, false);
  }

  for (const round of priorRounds) {
    for (const match of round.matches) {
      if (match.player1_score !== null) {
        scores.set(
          match.player1_id,
          (scores.get(match.player1_id) ?? 0) + (match.player1_score ?? 0),
        );
        lastColor.set(match.player1_id, "W");
      }

      if (match.player2_id && match.player2_score !== null) {
        scores.set(
          match.player2_id,
          (scores.get(match.player2_id) ?? 0) + (match.player2_score ?? 0),
        );
        lastColor.set(match.player2_id, "B");
      }

      if (match.player2_id) {
        opponents.get(match.player1_id)?.push(match.player2_id);
        opponents.get(match.player2_id)?.push(match.player1_id);
      } else if (match.player1_score !== null) {
        hadBye.set(match.player1_id, true);
      }
    }
  }

  const players = new Map<string, Player>();
  for (const reg of registrations) {
    players.set(reg.id, {
      id: reg.id,
      full_name: reg.full_name,
      chess_rating: reg.chess_rating ?? 0,
      score: scores.get(reg.id) ?? 0,
      opponentIds: opponents.get(reg.id) ?? [],
      lastColor: lastColor.get(reg.id) ?? null,
      hadBye: hadBye.get(reg.id) ?? false,
    });
  }

  return players;
}
