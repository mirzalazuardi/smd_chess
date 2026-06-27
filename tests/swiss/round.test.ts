import { describe, it, expect } from "vitest";
import { roundHasResults } from "@/lib/swiss/round";

describe("roundHasResults", () => {
  it("is false right after generation when only a BYE is auto-scored", () => {
    const matches = [
      { player2_id: "p2", player1_score: null },
      { player2_id: "p4", player1_score: null },
      { player2_id: null, player1_score: 1 }, // odd-player BYE
    ];
    expect(roundHasResults(matches)).toBe(false);
  });

  it("is true once a real game has a result", () => {
    const matches = [
      { player2_id: "p2", player1_score: 1 },
      { player2_id: null, player1_score: 1 },
    ];
    expect(roundHasResults(matches)).toBe(true);
  });

  it("is false when no match has a score", () => {
    const matches = [
      { player2_id: "p2", player1_score: null },
      { player2_id: "p4", player1_score: null },
    ];
    expect(roundHasResults(matches)).toBe(false);
  });

  it("treats a 0 score on a real game as a result", () => {
    const matches = [{ player2_id: "p2", player1_score: 0 }];
    expect(roundHasResults(matches)).toBe(true);
  });

  it("handles null and undefined match lists", () => {
    expect(roundHasResults(null)).toBe(false);
    expect(roundHasResults(undefined)).toBe(false);
  });
});
