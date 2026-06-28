import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseResultString,
  parseOverview,
  parsePlayerList,
  parsePairings,
  parseCrossTable,
  ChessResultsError,
} from "@/lib/sync/scraper";

// Real chess-results.com HTML (lan=1) captured from tnr1446778
// ("TURNAMEN CATUR NON MASTER LIGA PERCASI KAB SUMEDANG", 36 players, 5 rounds).
const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

// ─── parseResultString ─────────────────────────────────────────────────

describe("parseResultString", () => {
  it("parses 1-0 (white win)", () => {
    expect(parseResultString("1-0")).toEqual({
      player1Score: 1,
      player2Score: 0,
    });
  });

  it("parses 0 - 1 with spaces (black win)", () => {
    expect(parseResultString("0 - 1")).toEqual({
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

  it("returns null for unrecognized format", () => {
    expect(parseResultString("foo")).toEqual({
      player1Score: null,
      player2Score: null,
    });
  });
});

// ─── parseOverview ─────────────────────────────────────────────────────

describe("parseOverview", () => {
  it("extracts the tournament name from the page heading", () => {
    const meta = parseOverview(fixture("overview.html"));
    expect(meta.name).toBe(
      "TURNAMEN CATUR NON MASTER LIGA PERCASI KAB SUMEDANG TINGKAT PELAJAR SD/MI PIALA SEKOLAH INSAN SEJAHTERA",
    );
  });

  it("ignores section headings like 'Starting rank'", () => {
    const meta = parseOverview(fixture("overview.html"));
    expect(meta.name).not.toBe("Starting rank");
  });

  it("falls back to the <title> when no heading is present", () => {
    const html =
      "<html><head><title>Chess-Results Server - My Open 2026</title></head><body></body></html>";
    expect(parseOverview(html).name).toBe("My Open 2026");
  });

  it("derives round count from N.Rd columns when present", () => {
    const meta = parseOverview(fixture("crosstable.html"));
    expect(meta.rounds).toBe(5);
  });
});

// ─── parsePlayerList ───────────────────────────────────────────────────

describe("parsePlayerList", () => {
  it("parses all players with correct column mapping", () => {
    const players = parsePlayerList(fixture("players.html"));
    expect(players).toHaveLength(36);

    const guntur = players.find((p) => p.startNo === 10);
    expect(guntur).toEqual({
      startNo: 10,
      name: "GUNTUR PAMUNGKAS",
      federation: "INA",
      rating: undefined, // rating "0" on chess-results means unrated
      club: "SDN DARMARAJA",
    });
  });

  it("strips trailing commas from names", () => {
    const players = parsePlayerList(fixture("players.html"));
    expect(players.every((p) => !p.name.endsWith(","))).toBe(true);
  });

  it("throws ChessResultsError when no table is present", () => {
    expect(() => parsePlayerList("<html><body>No players</body></html>")).toThrow(
      ChessResultsError,
    );
  });
});

// ─── parsePairings ─────────────────────────────────────────────────────

describe("parsePairings", () => {
  it("parses round-1 pairings with White/Black/Result columns", () => {
    const pairings = parsePairings(fixture("pairings-rd1.html"), 1);
    expect(pairings.length).toBeGreaterThan(0);

    expect(pairings[0]).toEqual({
      table: 1,
      whiteName: "MUHAMMAD ARKAN ALQORNI",
      blackName: "ABIZAR FAIZ MUADZI",
      result: "0 - 1",
    });
  });

  it("returns empty array for a table-less page", () => {
    expect(parsePairings("<html><body>No pairings</body></html>", 1)).toHaveLength(
      0,
    );
  });

  it("detects BYE in the black column", () => {
    const html = `<table>
      <tr><th>Bo.</th><th>White</th><th>Black</th><th>Result</th></tr>
      <tr><td>1</td><td>Budi</td><td>bye</td><td>+ - -</td></tr>
    </table>`;
    expect(parsePairings(html, 1)[0].blackName).toBe("BYE");
  });
});

// ─── parseCrossTable ───────────────────────────────────────────────────

describe("parseCrossTable", () => {
  it("parses player results from the real cross table", () => {
    const results = parseCrossTable(fixture("crosstable.html"));
    expect(results).toHaveLength(36);

    const guntur = results.find((r) => r.playerName === "GUNTUR PAMUNGKAS");
    expect(guntur).toBeDefined();

    // Round 1 cell was "18w1" → opponent #18, white, win.
    const rd1 = guntur!.roundResults.find((r) => r.round === 1);
    expect(rd1).toEqual({
      round: 1,
      result: "1",
      color: "W",
      opponentName: "18",
    });
  });

  it("parses a loss cell '3w0'", () => {
    const html = `<table>
      <tr><th>Rk.</th><th>Name</th><th>1.Rd</th></tr>
      <tr><td>1</td><td>Player A</td><td>3w0</td></tr>
    </table>`;
    expect(parseCrossTable(html)[0].roundResults[0]).toEqual({
      round: 1,
      result: "0",
      color: "W",
      opponentName: "3",
    });
  });

  it("throws on missing round header", () => {
    const html =
      "<table><tr><td>No header</td></tr></table>";
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
