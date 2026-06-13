import type { Player, Pairing } from "./types";

export function generateSwissPairings(players: Player[]): Pairing[] {
  if (players.length === 0) return [];
  if (players.length === 1) {
    players[0].hadBye = true;
    return [{ white: players[0], black: null }];
  }

  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.chess_rating - a.chess_rating;
  });

  const unpaired = new Set(sorted.map((p) => p.id));
  const pairings: Pairing[] = [];
  const groups = groupByScore(sorted);

  for (let i = 0; i < groups.length; i++) {
    let group = groups[i].filter((p) => unpaired.has(p.id));

    if (group.length === 0) continue;

    // Pair within group
    const groupPairs = pairGroup(group);
    for (const pair of groupPairs) {
      pairings.push(pair);
      unpaired.delete(pair.white.id);
      if (pair.black) unpaired.delete(pair.black.id);
    }

    // If odd player remains and next group exists, float down
    const remaining = group.filter((p) => unpaired.has(p.id));
    if (remaining.length === 1 && i + 1 < groups.length) {
      groups[i + 1].push(remaining[0]);
    }
  }

  // Handle final odd player → bye
  const finalRemaining = sorted.filter((p) => unpaired.has(p.id));
  if (finalRemaining.length === 1) {
    const byePlayer = finalRemaining[0];
    byePlayer.hadBye = true;
    pairings.push({ white: byePlayer, black: null });
  }

  return pairings;
}

function groupByScore(players: Player[]): Player[][] {
  const groups: Player[][] = [];
  let currentGroup: Player[] = [];
  let currentScore: number | null = null;

  for (const player of players) {
    if (currentScore === null || player.score === currentScore) {
      currentGroup.push(player);
    } else {
      groups.push(currentGroup);
      currentGroup = [player];
    }
    currentScore = player.score;
  }

  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

function pairGroup(players: Player[]): Pairing[] {
  if (players.length < 2) return [];

  const pairings: Pairing[] = [];
  const available = [...players];
  const used = new Set<string>();

  while (available.length >= 2) {
    const p1 = available.shift()!;

    // Find first available opponent p1 hasn't faced
    let opponentIndex = available.findIndex(
      (p) => !p1.opponentIds.includes(p.id) && !used.has(p.id),
    );

    if (opponentIndex === -1) {
      // All remaining opponents already faced — pair anyway (last resort)
      opponentIndex = 0;
    }

    const p2 = available.splice(opponentIndex, 1)[0];
    used.add(p1.id);
    used.add(p2.id);

    // Assign colors
    const [white, black] = assignColors(p1, p2);

    white.lastColor = "W";
    black.lastColor = "B";

    pairings.push({ white, black });
  }

  return pairings;
}

function assignColors(p1: Player, p2: Player): [Player, Player] {
  // Prefer alternating colors
  if (p1.lastColor === "W" && p2.lastColor !== "W") return [p2, p1];
  if (p2.lastColor === "W" && p1.lastColor !== "W") return [p1, p2];
  if (p1.lastColor === "B" && p2.lastColor !== "B") return [p1, p2];
  if (p2.lastColor === "B" && p1.lastColor !== "B") return [p2, p1];

  // No clear preference — higher rated gets white
  if (p1.chess_rating >= p2.chess_rating) return [p1, p2];
  return [p2, p1];
}
