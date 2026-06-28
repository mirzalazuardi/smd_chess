interface ResultGateMatch {
  player2_id: string | null;
  player1_score: number | null;
}

// A round is locked for editing only once a *real* game has a result.
// The BYE match is auto-scored (player1_score = 1) at generation time and has
// no opponent (player2_id = null); that auto-point must NOT lock pairings.
export function roundHasResults(
  matches: ResultGateMatch[] | null | undefined,
): boolean {
  return (
    matches?.some(
      (match) => match.player2_id !== null && match.player1_score !== null,
    ) ?? false
  );
}

export function hasSubsequentRound(
  rounds: Array<{ round_number: number }>,
  currentRoundNumber: number,
): boolean {
  return rounds.some((r) => r.round_number > currentRoundNumber);
}
