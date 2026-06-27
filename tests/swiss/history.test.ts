import { describe, it, expect } from "vitest";
import { buildPlayerHistory } from "@/lib/swiss/history";

function reg(id: string, rating: number | null = null) {
  return {
    id,
    full_name: `Player ${id}`,
    chess_rating: rating,
  };
}

describe("buildPlayerHistory", () => {
  it("initializes all players with zero scores and defaults", () => {
    const players = buildPlayerHistory([reg("a"), reg("b", 1500)], []);

    expect(players.get("a")).toEqual({
      id: "a",
      full_name: "Player a",
      chess_rating: 0,
      score: 0,
      opponentIds: [],
      lastColor: null,
      hadBye: false,
    });

    expect(players.get("b")).toEqual({
      id: "b",
      full_name: "Player b",
      chess_rating: 1500,
      score: 0,
      opponentIds: [],
      lastColor: null,
      hadBye: false,
    });
  });

  it("accumulates scores, opponents, colors, and byes", () => {
    const players = buildPlayerHistory(
      [reg("a", 1600), reg("b", 1500), reg("c", 1400), reg("d", 1300)],
      [
        {
          id: "r1",
          round_number: 1,
          matches: [
            {
              player1_id: "a",
              player2_id: "b",
              player1_score: 1,
              player2_score: 0,
            },
          ],
        },
        {
          id: "r2",
          round_number: 2,
          matches: [
            {
              player1_id: "c",
              player2_id: "a",
              player1_score: 0.5,
              player2_score: 0.5,
            },
            {
              player1_id: "b",
              player2_id: null,
              player1_score: 1,
              player2_score: null,
            },
          ],
        },
      ],
    );

    expect(players.get("a")).toEqual({
      id: "a",
      full_name: "Player a",
      chess_rating: 1600,
      score: 1.5,
      opponentIds: ["b", "c"],
      lastColor: "B",
      hadBye: false,
    });

    expect(players.get("b")).toEqual({
      id: "b",
      full_name: "Player b",
      chess_rating: 1500,
      score: 1,
      opponentIds: ["a"],
      lastColor: "W",
      hadBye: true,
    });

    expect(players.get("c")).toEqual({
      id: "c",
      full_name: "Player c",
      chess_rating: 1400,
      score: 0.5,
      opponentIds: ["a"],
      lastColor: "W",
      hadBye: false,
    });

    expect(players.get("d")).toEqual({
      id: "d",
      full_name: "Player d",
      chess_rating: 1300,
      score: 0,
      opponentIds: [],
      lastColor: null,
      hadBye: false,
    });
  });
});
