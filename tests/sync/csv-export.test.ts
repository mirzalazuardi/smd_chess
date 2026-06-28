import { describe, it, expect } from "vitest";
import {
  generatePlayerCSV,
  generatePairingCSV,
  generateStandingsCSV,
} from "@/lib/sync/csv-export";

describe("generatePlayerCSV", () => {
  it("generates CSV with players", () => {
    const csv = generatePlayerCSV([
      { full_name: "Budi Santoso", chess_rating: 2100, school_name: "SMAN 1", student_status: "pelajar" },
      { full_name: "Ahmad Rizky", chess_rating: null, school_name: null, student_status: "umum" },
    ]);

    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("no,nama,rating,status,sekolah");
    expect(lines[1]).toBe("1,Budi Santoso,2100,pelajar,SMAN 1");
    expect(lines[2]).toBe("2,Ahmad Rizky,,umum,");
  });

  it("escapes commas in names", () => {
    const csv = generatePlayerCSV([
      { full_name: "Smith, John", chess_rating: 1800, school_name: null, student_status: "umum" },
    ]);

    const lines = csv.trim().split("\n");
    expect(lines[1]).toContain('"Smith, John"');
  });
});

describe("generatePairingCSV", () => {
  const playerMap = new Map([
    ["p1", "Budi"],
    ["p2", "Ahmad"],
  ]);

  it("generates pairing CSV with normal game and BYE", () => {
    const csv = generatePairingCSV(
      [
        {
          round_number: 1,
          matches: [
            { table_no: 1, player1_id: "p1", player2_id: "p2", player1_score: 1, player2_score: 0 },
            { table_no: null, player1_id: "p2", player2_id: null, player1_score: 1, player2_score: null },
          ],
        },
      ],
      playerMap,
    );

    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("ronde,meja,putih,hitam,hasil");
    expect(lines[1]).toBe("1,1,Budi,Ahmad,1-0");
    expect(lines[2]).toBe("1,-,Ahmad,BYE,1-0 (bye)");
  });

  it("handles unplayed games", () => {
    const csv = generatePairingCSV(
      [
        {
          round_number: 2,
          matches: [
            { table_no: 1, player1_id: "p1", player2_id: "p2", player1_score: null, player2_score: null },
          ],
        },
      ],
      playerMap,
    );

    expect(csv).toContain("2,1,Budi,Ahmad,");
  });
});

describe("generateStandingsCSV", () => {
  it("generates standings CSV", () => {
    const csv = generateStandingsCSV([
      { rank: 1, name: "Budi", rating: 2100, points: 5.0, buchholz: 28.5 },
      { rank: 2, name: "Ahmad", rating: 1950, points: 4.5, buchholz: 27.0 },
    ]);

    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("peringkat,nama,rating,poin,buchholz");
    expect(lines[1]).toBe("1,Budi,2100,5,28.5");
    expect(lines[2]).toBe("2,Ahmad,1950,4.5,27");
  });
});
