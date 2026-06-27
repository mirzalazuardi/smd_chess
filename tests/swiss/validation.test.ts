import { describe, it, expect } from "vitest";
import { validatePairings } from "@/lib/swiss/validation";
import type { Player, Pairing } from "@/lib/swiss/types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    full_name: "Test",
    chess_rating: 1500,
    score: 0,
    opponentIds: [],
    lastColor: null,
    hadBye: false,
    ...overrides,
  };
}

describe("validatePairings", () => {
  it("returns invalid_permutation error when player set does not match expectedPlayerIds", () => {
    const pairings: Pairing[] = [
      { white: makePlayer({ id: "p1" }), black: makePlayer({ id: "p2" }), tableNo: 1 },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p3"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "invalid_permutation",
      severity: "error",
      message: "Permutasi tidak sah: kumpulan pemain tidak cocok",
    });
    expect(result.warnings).toEqual([]);
  });

  it("returns rematch error when a non-first-round pairing repeats a previous opponent", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({ id: "p1", full_name: "Andi", opponentIds: ["p2"] }),
        black: makePlayer({ id: "p2", full_name: "Budi" }),
        tableNo: 1,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "rematch",
      severity: "error",
      tableNo: 1,
      playerIds: ["p1", "p2"],
      message: "Rematch: Andi vs Budi sudah bertemu di ronde sebelumnya",
    });
    expect(result.warnings).toEqual([]);
  });

  it("returns repeat_bye error when a player with prior bye gets bye again", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({ id: "p1", full_name: "Andi", hadBye: true }),
        black: null,
        tableNo: null,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "repeat_bye",
      severity: "error",
      message: "Andi sudah bye sebelumnya, tidak boleh bye lagi",
      tableNo: null,
      playerIds: ["p1"],
    });
    expect(result.warnings).toEqual([]);
  });

  it("returns repeat_bye error for the second bye in the same round", () => {
    const pairings: Pairing[] = [
      { white: makePlayer({ id: "p1", full_name: "Andi" }), black: null, tableNo: null },
      { white: makePlayer({ id: "p2", full_name: "Budi" }), black: null, tableNo: null },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "repeat_bye",
      severity: "error",
      message: "Hanya boleh ada satu bye per ronde",
      tableNo: null,
      playerIds: ["p2"],
    });
    expect(result.warnings).toEqual([]);
  });

  it("returns color_repeat warnings for repeated colors", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({ id: "p1", full_name: "Andi", lastColor: "W" }),
        black: makePlayer({ id: "p2", full_name: "Budi", lastColor: "B" }),
        tableNo: 1,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatchObject({
      code: "color_repeat",
      severity: "warning",
      message: "Putih dua kali berturut-turut untuk Andi",
      tableNo: 1,
      playerIds: ["p1"],
    });
    expect(result.warnings[1]).toMatchObject({
      code: "color_repeat",
      severity: "warning",
      message: "Hitam dua kali berturut-turut untuk Budi",
      tableNo: 1,
      playerIds: ["p2"],
    });
  });

  it("returns score_gap warning when score difference exceeds default threshold", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({ id: "p1", full_name: "Andi", score: 3 }),
        black: makePlayer({ id: "p2", full_name: "Budi", score: 1.5 }),
        tableNo: 1,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      code: "score_gap",
      severity: "warning",
      message: "Selisih skor terlalu jauh: Andi (3) vs Budi (1.5)",
      tableNo: 1,
      playerIds: ["p1", "p2"],
    });
  });

  it("skips rematch, bye, color, and score checks in the first round", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({
          id: "p1",
          full_name: "Andi",
          opponentIds: ["p2"],
          lastColor: "W",
          score: 3,
        }),
        black: makePlayer({
          id: "p2",
          full_name: "Budi",
          lastColor: "B",
          score: 1,
        }),
        tableNo: 1,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: true,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("returns ok false when any error exists and separates errors from warnings", () => {
    const pairings: Pairing[] = [
      {
        white: makePlayer({ id: "p1", full_name: "Andi", opponentIds: ["p2"] }),
        black: makePlayer({ id: "p2", full_name: "Budi", lastColor: "B" }),
        tableNo: 1,
      },
    ];

    const result = validatePairings(pairings, {
      firstRound: false,
      expectedPlayerIds: ["p1", "p2"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      {
        code: "rematch",
        severity: "error",
        message: "Rematch: Andi vs Budi sudah bertemu di ronde sebelumnya",
        tableNo: 1,
        playerIds: ["p1", "p2"],
      },
    ]);
    expect(result.warnings).toEqual([
      {
        code: "color_repeat",
        severity: "warning",
        message: "Hitam dua kali berturut-turut untuk Budi",
        tableNo: 1,
        playerIds: ["p2"],
      },
    ]);
  });
});
