import { describe, it, expect } from "vitest";
import { calculateStandings } from "@/lib/swiss/standings";
import type { Player } from "@/lib/swiss/types";

function makePlayer(
  id: string,
  score: number,
  rating: number,
  opponentIds: string[] = [],
): Player {
  return {
    id,
    full_name: `Player ${id}`,
    chess_rating: rating,
    score,
    opponentIds,
    lastColor: null,
    hadBye: false,
  };
}

describe("calculateStandings", () => {
  it("ranks by score descending", () => {
    const players = [
      makePlayer("1", 3, 1500),
      makePlayer("2", 1, 1600),
      makePlayer("3", 2, 1400),
    ];

    const standings = calculateStandings(players, []);
    expect(standings[0].playerId).toBe("1");
    expect(standings[1].playerId).toBe("3");
    expect(standings[2].playerId).toBe("2");
  });

  it("uses Buchholz as tiebreaker", () => {
    const players = [
      makePlayer("1", 3, 2000),
      makePlayer("2", 3, 1800),
      makePlayer("3", 0, 1600),
      makePlayer("4", 0, 1400),
    ];

    const matches = [
      {
        playerIds: ["1", "3"] as [string, string | null],
        results: [1, 0] as [number, number | null],
      },
      {
        playerIds: ["2", "4"] as [string, string | null],
        results: [1, 0] as [number, number | null],
      },
    ];

    const standings = calculateStandings(players, matches);

    // Player 1 beat Player 3 (score 0), Player 2 beat Player 4 (score 0)
    // Buchholz for both = 0, so rating breaks tie
    expect(standings[0].playerId).toBe("1");
    expect(standings[1].playerId).toBe("2");
  });

  it("calculates Buchholz from opponents' scores", () => {
    const players = [
      makePlayer("1", 3, 2000),
      makePlayer("2", 2, 1800),
      makePlayer("3", 1, 1600),
    ];

    const matches = [
      {
        playerIds: ["1", "2"] as [string, string],
        results: [1, 0] as [number, number],
      },
      {
        playerIds: ["2", "3"] as [string, string],
        results: [1, 0] as [number, number],
      },
      {
        playerIds: ["1", "3"] as [string, string],
        results: [1, 0] as [number, number],
      },
    ];

    const standings = calculateStandings(players, matches);

    // Player 1: opponents p2(2) + p3(1) = Buchholz 3
    expect(standings[0].buchholz).toBe(3);

    // Player 2: opponents p1(3) + p3(1) = Buchholz 4
    expect(standings[1].buchholz).toBe(4);

    // Player 3: opponents p1(3) + p2(2) = Buchholz 5
    expect(standings[2].buchholz).toBe(5);
  });

  it("counts wins, draws, losses", () => {
    const players = [
      makePlayer("1", 2.5, 2000),
      makePlayer("2", 1.5, 1800),
    ];

    const matches = [
      {
        playerIds: ["1", "2"] as [string, string],
        results: [0.5, 0.5] as [number, number],
      },
    ];

    const standings = calculateStandings(players, matches);
    expect(standings[0].wins).toBe(0);
    expect(standings[0].draws).toBe(1);
    expect(standings[0].losses).toBe(0);
    expect(standings[1].wins).toBe(0);
    expect(standings[1].draws).toBe(1);
    expect(standings[1].losses).toBe(0);
  });

  it("handles empty player list", () => {
    const standings = calculateStandings([], []);
    expect(standings).toEqual([]);
  });

  it("handles player with no matches", () => {
    const players = [makePlayer("1", 0, 1500)];
    const standings = calculateStandings(players, []);
    expect(standings[0].buchholz).toBe(0);
    expect(standings[0].wins).toBe(0);
    expect(standings[0].draws).toBe(0);
    expect(standings[0].losses).toBe(0);
  });
});
