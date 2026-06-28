import { describe, it, expect } from "vitest";
import { generateTRF, generateTRFFromSMD } from "@/lib/sync/trf-export";

describe("generateTRF", () => {
  it("generates valid TRF with two players and two rounds", () => {
    const output = generateTRF(
      { name: "Test Open 2026", federation: "INA", city: "Sumedang" },
      [
        { startNo: 1, name: "Budi Santoso", rating: 2100, federation: "INA" },
        { startNo: 2, name: "Ahmad Rizky", rating: 1950, federation: "INA" },
      ],
      [
        {
          roundNumber: 1,
          date: "2026/06/15",
          games: [
            { table: 1, whiteNo: 1, blackNo: 2, result: "1-0" },
            { table: 2, whiteNo: 3, blackNo: 0, result: "bye" },
          ],
        },
        {
          roundNumber: 2,
          date: "2026/06/16",
          games: [{ table: 1, whiteNo: 2, blackNo: 1, result: "½-½" }],
        },
      ],
    );

    expect(output).toContain("012 Test Open 2026");
    expect(output).toContain("022 Sumedang");
    expect(output).toContain("032 INA");
    expect(output).toContain("092 2");
    expect(output).toContain("102 2");
    expect(output).toContain("XXR   2");
    expect(output).toContain("Budi Santoso");
    expect(output).toContain("Ahmad Rizky");
    expect(output).toContain("RD  1  2026/06/15");
    expect(output).toContain("RD  2  2026/06/16");
    expect(output).toContain("bye");
    expect(output).toContain("=");
  });

  it("skips optional fields when not provided", () => {
    const output = generateTRF(
      { name: "Minimal", federation: "INA" },
      [{ startNo: 1, name: "One Player", federation: "INA" }],
      [],
    );

    expect(output).toContain("012 Minimal");
    expect(output).not.toContain("022");
    expect(output).not.toContain("042");
    expect(output).not.toContain("062");
  });

  it("handles draw result codes", () => {
    const output = generateTRF(
      { name: "Draw Test", federation: "INA" },
      [
        { startNo: 1, name: "Player A", federation: "INA" },
        { startNo: 2, name: "Player B", federation: "INA" },
      ],
      [
        {
          roundNumber: 1,
          games: [{ table: 1, whiteNo: 1, blackNo: 2, result: "=" }],
        },
      ],
    );

    expect(output).toContain("=");
  });

  it("formats player line correctly with padding", () => {
    const output = generateTRF(
      { name: "Format Test", federation: "INA" },
      [
        {
          startNo: 1,
          name: "GM Smith",
          rating: 2500,
          title: "GM",
          federation: "USA",
        },
      ],
      [],
    );

    // Rating column: right-aligned 4 chars
    expect(output).toMatch(/001\s+1\s+2500\s+GM\s/);
  });
});

describe("generateTRFFromSMD", () => {
  it("converts SMD data structures to TRF", () => {
    const output = generateTRFFromSMD(
      { name: "Sumedang Open", code: "smd-open-2026", rounds_count: 1 },
      [
        { id: "uuid-1", full_name: "Budi", chess_rating: 2100 },
        { id: "uuid-2", full_name: "Ahmad", chess_rating: null },
      ],
      [
        {
          round_number: 1,
          matches: [
            {
              player1_id: "uuid-1",
              player2_id: "uuid-2",
              table_no: 1,
              player1_score: 0.5,
              player2_score: 0.5,
            },
          ],
        },
      ],
    );

    expect(output).toContain("012 Sumedang Open");
    expect(output).toContain("Budi");
    expect(output).toContain("Ahmad");
    expect(output).toContain("="); // draw
  });

  it("handles BYE matches", () => {
    const output = generateTRFFromSMD(
      { name: "BYE Test", code: "bye-test", rounds_count: 1 },
      [{ id: "uuid-1", full_name: "Budi", chess_rating: 2100 }],
      [
        {
          round_number: 1,
          matches: [
            {
              player1_id: "uuid-1",
              player2_id: null,
              table_no: null,
              player1_score: 1,
              player2_score: null,
            },
          ],
        },
      ],
    );

    expect(output).toContain("bye");
  });
});
