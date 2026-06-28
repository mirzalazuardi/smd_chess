import { describe, it, expect } from "vitest";
import {
  mapPlayersToRegistrations,
  detectDuplicates,
  mapPairingsToMatches,
  buildPlayerLookupMaps,
  extractExistingNames,
} from "@/lib/sync/mapper";

describe("mapPlayersToRegistrations", () => {
  it("maps chess-results players to SMD registrations", () => {
    const players = [
      { startNo: 1, name: "Budi Santoso", federation: "INA", rating: 2100, club: "SMAN 1" },
      { startNo: 2, name: "Ahmad Rizky", federation: "INA", rating: undefined, club: undefined },
    ];

    const result = mapPlayersToRegistrations(players);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      full_name: "Budi Santoso",
      student_status: "umum",
      school_name: "SMAN 1",
      chess_rating: 2100,
      paid: true,
      is_active: true,
      sourceStartNo: 1,
    });
    expect(result[1].chess_rating).toBeNull();
    expect(result[1].school_name).toBeNull();
  });
});

describe("detectDuplicates", () => {
  it("separates new from duplicate players", () => {
    const newPlayers = [
      { full_name: "Budi", student_status: "umum" as const, school_name: null, chess_rating: null, paid: true, is_active: true, proof_transfer_url: null as null, sourceStartNo: 1 },
      { full_name: "Ahmad", student_status: "umum" as const, school_name: null, chess_rating: null, paid: true, is_active: true, proof_transfer_url: null as null, sourceStartNo: 2 },
      { full_name: "Candra", student_status: "umum" as const, school_name: null, chess_rating: null, paid: true, is_active: true, proof_transfer_url: null as null, sourceStartNo: 3 },
    ];

    const result = detectDuplicates(newPlayers, ["Budi", "Dewi"]);

    expect(result.unique).toHaveLength(2);
    expect(result.unique[0].full_name).toBe("Ahmad");
    expect(result.unique[1].full_name).toBe("Candra");

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].name).toBe("Budi");
    expect(result.duplicates[0].reason).toBe("duplikat nama");
  });

  it("handles case-insensitive duplicates", () => {
    const newPlayers = [
      { full_name: "Budi Santoso", student_status: "umum" as const, school_name: null, chess_rating: null, paid: true, is_active: true, proof_transfer_url: null as null, sourceStartNo: 1 },
    ];

    const result = detectDuplicates(newPlayers, ["BUDI SANTOSO"]);
    expect(result.duplicates).toHaveLength(1);
    expect(result.unique).toHaveLength(0);
  });
});

describe("mapPairingsToMatches", () => {
  it("maps pairings to match inserts with player IDs", () => {
    const pairings = [
      { table: 1, whiteName: "Budi", blackName: "Ahmad", result: "1-0" },
      { table: 2, whiteName: "Candra", blackName: "BYE", result: "+ - -" },
    ];

    const nameToId = new Map([["budi", "uuid-budi"], ["ahmad", "uuid-ahmad"], ["candra", "uuid-candra"]]);
    const startNoToId = new Map<number, string>();

    const result = mapPairingsToMatches(pairings, nameToId, startNoToId);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      player1_id: "uuid-budi",
      player2_id: "uuid-ahmad",
      table_no: 1,
      status: "completed",
    });
    expect(result[1]).toMatchObject({
      player1_id: "uuid-candra",
      player2_id: null,
      table_no: 2,
      player1_score: 1,
      status: "completed",
    });
  });
});

describe("buildPlayerLookupMaps", () => {
  it("builds name and startNo lookup maps", () => {
    const imported = [
      { id: "uuid-1", full_name: "Budi Santoso", sourceStartNo: 1 },
      { id: "uuid-2", full_name: "Ahmad Rizky", sourceStartNo: null },
    ];
    const scraped = [
      { startNo: 1, name: "Budi Santoso", federation: "INA", rating: 2100 },
      { startNo: 2, name: "Ahmad Rizky", federation: "INA", rating: 1950 },
    ];

    const { nameToId, startNoToId } = buildPlayerLookupMaps(imported, scraped);

    expect(nameToId.get("budi santoso")).toBe("uuid-1");
    expect(nameToId.get("ahmad rizky")).toBe("uuid-2");
    expect(startNoToId.get(1)).toBe("uuid-1");
    expect(startNoToId.get(2)).toBe("uuid-2");
  });
});

describe("extractExistingNames", () => {
  it("extracts and normalizes existing player names", () => {
    const registrations = [
      { full_name: "Budi Santoso" },
      { full_name: "  Ahmad Rizky  " },
    ];

    const result = extractExistingNames(registrations);
    expect(result).toEqual(["budi santoso", "ahmad rizky"]);
  });
});
