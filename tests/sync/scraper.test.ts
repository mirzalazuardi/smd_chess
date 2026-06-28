import { describe, it, expect } from "vitest";
import {
  parseResultString,
  parseOverview,
  parsePlayerList,
  parsePairings,
  parseCrossTable,
  ChessResultsError,
} from "@/lib/sync/scraper";

// ─── parseResultString ─────────────────────────────────────────────────

describe("parseResultString", () => {
  it("parses 1-0 (white win)", () => {
    expect(parseResultString("1-0")).toEqual({
      player1Score: 1,
      player2Score: 0,
    });
  });

  it("parses 1 - 0 with spaces", () => {
    expect(parseResultString("1 - 0")).toEqual({
      player1Score: 1,
      player2Score: 0,
    });
  });

  it("parses 0-1 (black win)", () => {
    expect(parseResultString("0-1")).toEqual({
      player1Score: 0,
      player2Score: 1,
    });
  });

  it("parses ½-½ (draw)", () => {
    expect(parseResultString("½-½")).toEqual({
      player1Score: 0.5,
      player2Score: 0.5,
    });
  });

  it("parses + - - (white wins by forfeit)", () => {
    expect(parseResultString("+ - -")).toEqual({
      player1Score: 1,
      player2Score: 0,
    });
  });

  it("parses - - + (black wins by forfeit)", () => {
    expect(parseResultString("- - +")).toEqual({
      player1Score: 0,
      player2Score: 1,
    });
  });

  it("returns null for empty string", () => {
    expect(parseResultString("")).toEqual({
      player1Score: null,
      player2Score: null,
    });
  });

  it("returns null for unrecognized format", () => {
    expect(parseResultString("foo")).toEqual({
      player1Score: null,
      player2Score: null,
    });
  });
});

// ─── parseOverview ─────────────────────────────────────────────────────

describe("parseOverview", () => {
  it("extracts tournament name and rounds", () => {
    const html = `
      <html><body>
        <h2>Tournament selection: Kejuaraan Catur Sumedang Open 2026</h2>
        <p>Rounds: 7</p>
        <p>Federation: INA</p>
      </body></html>`;

    const meta = parseOverview(html);
    expect(meta.name).toBe("Kejuaraan Catur Sumedang Open 2026");
    expect(meta.rounds).toBe(7);
    expect(meta.federation).toBe("INA");
  });

  it("extracts dates when present", () => {
    const html = `
      <html><body>
        <h2>Tournament selection: Test Tournament</h2>
        <p>Rounds: 5</p>
        <p>Date: 2026/06/15 to 2026/06/20</p>
      </body></html>`;

    const meta = parseOverview(html);
    expect(meta.startDate).toBe("2026/06/15");
    expect(meta.endDate).toBe("2026/06/20");
  });

  it("returns 0 rounds when not found", () => {
    const html =
      "<html><body><h2>Tournament selection: Test Event</h2></body></html>";
    const meta = parseOverview(html);
    expect(meta.rounds).toBe(0);
    expect(meta.name).toBe("Test Event");
  });

  it("extracts arbiter", () => {
    const html = `
      <html><body>
        <h2>Tournament selection: Test</h2>
        <p>Rounds: 3</p>
        <p>Arbiter: John Doe</p>
      </body></html>`;

    const meta = parseOverview(html);
    expect(meta.arbiter).toBe("John Doe");
  });
});

// ─── parsePlayerList ───────────────────────────────────────────────────

describe("parsePlayerList", () => {
  function playerTableHtml(rows: string[]): string {
    return `<html><body><table>${rows.join("")}</table></body></html>`;
  }

  it("parses player rows with rating", () => {
    const html = playerTableHtml([
      "<tr><th>No.</th><th>Name</th><th>FED</th><th>Rtg</th><th>Club</th></tr>",
      "<tr><td>1</td><td>Budi Santoso</td><td>INA</td><td>2100</td><td>SMAN 1</td></tr>",
      "<tr><td>2</td><td>Ahmad Rizky</td><td>INA</td><td>1950</td><td>SMKN 2</td></tr>",
    ]);

    const players = parsePlayerList(html);
    expect(players).toHaveLength(2);
    expect(players[0]).toEqual({
      startNo: 1,
      name: "Budi Santoso",
      federation: "INA",
      rating: 2100,
      club: "SMAN 1",
    });
  });

  it("handles missing rating", () => {
    const html = playerTableHtml([
      "<tr><th>No.</th><th>Name</th><th>FED</th><th>Rtg</th></tr>",
      "<tr><td>1</td><td>Candra Wijaya</td><td>INA</td><td></td></tr>",
    ]);

    const players = parsePlayerList(html);
    expect(players).toHaveLength(1);
    expect(players[0].rating).toBeUndefined();
  });

  it("throws ChessResultsError on empty table", () => {
    const html = "<html><body>No players</body></html>";
    expect(() => parsePlayerList(html)).toThrow(ChessResultsError);
  });
});

// ─── parsePairings ─────────────────────────────────────────────────────

describe("parsePairings", () => {
  function pairingTableHtml(rows: string[]): string {
    return `<html><body><table>${rows.join("")}</table></body></html>`;
  }

  it("parses normal pairings", () => {
    const html = pairingTableHtml([
      "<tr><th>Bo.</th><th>White</th><th>Black</th><th>Result</th></tr>",
      "<tr><td>1</td><td>Budi</td><td>Ahmad</td><td>1-0</td></tr>",
      "<tr><td>2</td><td>Dewi</td><td>Candra</td><td>½-½</td></tr>",
    ]);

    const pairings = parsePairings(html, 1);
    expect(pairings).toHaveLength(2);
    expect(pairings[0]).toEqual({
      table: 1,
      whiteName: "Budi",
      blackName: "Ahmad",
      result: "1-0",
    });
  });

  it("detects BYE", () => {
    const html = pairingTableHtml([
      "<tr><th>Bo.</th><th>White</th><th>Black</th><th>Result</th></tr>",
      "<tr><td>1</td><td>Budi</td><td>bye</td><td>+ - -</td></tr>",
    ]);

    const pairings = parsePairings(html, 1);
    expect(pairings).toHaveLength(1);
    expect(pairings[0].blackName).toBe("BYE");
    expect(pairings[0].result).toBe("+ - -");
  });

  it("detects Indonesian 'lewat' as BYE", () => {
    const html = pairingTableHtml([
      "<tr><th>Bo.</th><th>White</th><th>Black</th></tr>",
      "<tr><td>1</td><td>Budi</td><td>lewat</td></tr>",
    ]);

    const pairings = parsePairings(html, 1);
    expect(pairings[0].blackName).toBe("BYE");
  });

  it("returns empty array for empty table", () => {
    const html = "<html><body>No pairings</body></html>";
    const pairings = parsePairings(html, 1);
    expect(pairings).toHaveLength(0);
  });
});

// ─── parseCrossTable ───────────────────────────────────────────────────

describe("parseCrossTable", () => {
  it("parses simple cross table", () => {
    const html = `
      <html><body><table>
        <tr><th>Rk.</th><th>Name</th><th>Rd.1</th><th>Rd.2</th></tr>
        <tr><td>1</td><td>Budi</td><td>1w 2</td><td>½b 3</td></tr>
        <tr><td>2</td><td>Ahmad</td><td>0b 1</td><td>1w 3</td></tr>
      </table></body></html>`;

    const results = parseCrossTable(html);
    expect(results).toHaveLength(2);

    expect(results[0].playerName).toBe("Budi");
    expect(results[0].roundResults).toHaveLength(2);
    expect(results[0].roundResults[0]).toEqual({
      round: 1,
      result: "1",
      color: "W",
      opponentName: "2",
    });
  });

  it("throws on missing header", () => {
    const html = "<html><body><table><tr><td>No header</td></tr></table></body></html>";
    expect(() => parseCrossTable(html)).toThrow(ChessResultsError);
  });
});

// ─── ChessResultsError ─────────────────────────────────────────────────

describe("ChessResultsError", () => {
  it("has code and message", () => {
    const err = new ChessResultsError("Not found", "NOT_FOUND");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("ChessResultsError");
    expect(err).toBeInstanceOf(Error);
  });
});
