import { describe, it, expect } from "vitest";
import { hasSubsequentRound } from "@/lib/swiss/round";

describe("hasSubsequentRound", () => {
  const empty: Array<{ round_number: number }> = [];

  it("returns false when no rounds exist", () => {
    expect(hasSubsequentRound(empty, 1)).toBe(false);
  });

  it("returns false when current round is the highest", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
    ];
    expect(hasSubsequentRound(rounds, 2)).toBe(false);
  });

  it("returns true when a higher round_number exists", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
      { round_number: 3 },
    ];
    expect(hasSubsequentRound(rounds, 2)).toBe(true);
  });

  it("returns false when only lower rounds exist", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
    ];
    expect(hasSubsequentRound(rounds, 3)).toBe(false);
    expect(hasSubsequentRound(rounds, 4)).toBe(false);
  });
});
