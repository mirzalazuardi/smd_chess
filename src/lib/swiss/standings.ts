import type { Player, StandingsEntry, MatchResult } from "./types";

interface MatchRecord {
  playerIds: [string, string | null];
  results: [number, number | null];
}

export function calculateStandings(
  players: Player[],
  allMatches: MatchRecord[],
): StandingsEntry[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const buchholzMap = computeBuchholz(players, allMatches, playerMap);
  const statsMap = computeMatchStats(players, allMatches);

  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const bA = buchholzMap.get(a.id) ?? 0;
    const bB = buchholzMap.get(b.id) ?? 0;
    if (bB !== bA) return bB - bA;
    return b.chess_rating - a.chess_rating;
  });

  return sorted.map((player, index) => {
    const stats = statsMap.get(player.id)!;
    return {
      rank: index + 1,
      playerId: player.id,
      fullName: player.full_name,
      score: player.score,
      buchholz: buchholzMap.get(player.id) ?? 0,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
    };
  });
}

function computeBuchholz(
  players: Player[],
  allMatches: MatchRecord[],
  playerMap: Map<string, Player>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const player of players) {
    let buchholz = 0;
    for (const match of allMatches) {
      const [p1, p2] = match.playerIds;
      if (p1 === player.id && p2) {
        buchholz += playerMap.get(p2)?.score ?? 0;
      } else if (p2 === player.id) {
        buchholz += playerMap.get(p1)?.score ?? 0;
      }
    }
    map.set(player.id, buchholz);
  }
  return map;
}

function computeMatchStats(
  players: Player[],
  allMatches: MatchRecord[],
): Map<string, { wins: number; draws: number; losses: number }> {
  const map = new Map<string, { wins: number; draws: number; losses: number }>();
  const empty = { wins: 0, draws: 0, losses: 0 };

  for (const player of players) {
    let wins = 0, draws = 0, losses = 0;

    for (const match of allMatches) {
      const [p1, p2] = match.playerIds;
      const [r1, r2] = match.results;

      if (p1 === player.id) {
        if (r1 === 1) wins++;
        else if (r1 === 0.5) draws++;
        else if (r1 !== null) losses++;
      } else if (p2 === player.id) {
        if (r2 === 1) wins++;
        else if (r2 === 0.5) draws++;
        else if (r2 !== null) losses++;
      }
    }

    map.set(player.id, { wins, draws, losses });
  }

  return map;
}
