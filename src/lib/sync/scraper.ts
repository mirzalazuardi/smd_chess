/**
 * chess-results.com HTML scraper.
 *
 * chess-results.com does NOT have a public API.
 * We fetch HTML pages and parse the structured tables.
 *
 * URL pattern: https://chess-results.com/tnr{ID}.aspx?lan=18&art={ART}
 *   art=0 → overview (tournament metadata)
 *   art=1 → player list (table: No, Name, FED, Rtg, Club)
 *   art=2 → pairings per round (table: Board, White, Black, Result) + rd={N}
 *   art=4 → cross table (matrix: player × round = result + opponent)
 */

const BASE_URL = "https://chess-results.com";
const FETCH_TIMEOUT_MS = 15_000;

// ─── Error ────────────────────────────────────────────────────────────

export class ChessResultsError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "PARSE" | "NOT_FOUND" | "INVALID_URL",
  ) {
    super(message);
    this.name = "ChessResultsError";
  }
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface TournamentMeta {
  name: string;
  federation?: string;
  startDate?: string;
  endDate?: string;
  rounds: number;
  arbiter?: string;
  city?: string;
}

export interface ChessResultsPlayer {
  startNo: number;
  name: string;
  federation?: string;
  rating?: number;
  club?: string;
}

export interface ChessResultsPairing {
  table: number;
  whiteName: string;
  blackName: string;
  result?: string; // "1-0", "0-1", "½-½", "+ - -", or undefined (not played)
}

export interface ChessResultsRoundResult {
  round: number;
  result: "1" | "0" | "½" | "" | "+" | "-";
  opponentName?: string;
  color?: "W" | "B";
}

export interface ChessResultsResult {
  playerName: string;
  roundResults: ChessResultsRoundResult[];
}

// ─── Fetch ─────────────────────────────────────────────────────────────

export async function fetchTournamentPage(
  tnrId: string,
  art: number,
  extraParams?: string,
): Promise<string> {
  // lan=1 → English. chess-results renders stable English column headers
  // ("Name", "FED", "Rtg", "White", "Black", "Result", "N.Rd") that the
  // parsers below rely on. Other languages (e.g. lan=18 = Finnish) change
  // every label and break parsing.
  const params = [`lan=1`, `art=${art}`];
  if (extraParams) params.push(extraParams);

  const url = `${BASE_URL}/tnr${tnrId}.aspx?${params.join("&")}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      if (res.status === 404) {
        throw new ChessResultsError(
          `Turnamen tidak ditemukan (tnr${tnrId})`,
          "NOT_FOUND",
        );
      }
      throw new ChessResultsError(
        `chess-results.com merespon dengan status ${res.status}`,
        "NETWORK",
      );
    }

    return await res.text();
  } catch (err) {
    if (err instanceof ChessResultsError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ChessResultsError(
        "chess-results.com tidak merespon (timeout)",
        "NETWORK",
      );
    }

    throw new ChessResultsError(
      `Gagal menghubungi chess-results.com: ${(err as Error).message}`,
      "NETWORK",
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ─── HTML Helpers ──────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Split HTML by <tr> tags, returns array of <td> content arrays */
function extractTableRows(
  html: string,
  tableSelector?: RegExp,
): string[][] {
  // Find the relevant table
  let tableHtml = html;
  if (tableSelector) {
    const match = html.match(tableSelector);
    if (!match) return [];
    tableHtml = match[0];
  }

  const rows: string[][] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const tdRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let tdMatch: RegExpExecArray | null;

    while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
      cells.push(cleanText(stripTags(tdMatch[1])));
    }

    if (cells.length > 0) rows.push(cells);
  }

  return rows;
}

/**
 * Find the index of the first header cell matching the given pattern.
 * Returns -1 if no column matches.
 */
function findColumn(header: string[], pattern: RegExp): number {
  return header.findIndex((cell) => pattern.test(cell));
}

/** chess-results renders player names with a trailing comma ("ALIF,"). */
function cleanName(name: string): string {
  return name.replace(/,\s*$/, "").trim();
}

/** Section headings that are NOT the tournament title. */
const SECTION_HEADINGS =
  /^(starting rank|alphabetical|ranking|cross\s*table|pairings|results?|standings|player|round)/i;

// ─── Parse Overview ────────────────────────────────────────────────────

export function parseOverview(html: string): TournamentMeta {
  // The tournament name is rendered as an <h2> heading. The page also has
  // section headings ("Starting rank", "Cross table", …) — skip those and
  // take the first heading that looks like an actual tournament title.
  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((m) => cleanText(stripTags(m[1])))
    .filter((h) => h.length > 0);

  let name =
    headings.find((h) => !SECTION_HEADINGS.test(h)) ?? headings[0] ?? "";

  // Fallback: the <title> ends with " - <tournament name>".
  if (!name) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? cleanText(stripTags(titleMatch[1])) : "";
    name = title.split(/\s+-\s+/).pop()?.trim() ?? "Unknown Tournament";
  }

  if (!name) name = "Unknown Tournament";

  const text = cleanText(stripTags(html));

  // Round count: the cross-table view exposes "1.Rd 2.Rd …" columns.
  // Take the highest round number seen (0 if this page has none).
  const roundNumbers = [...text.matchAll(/(\d+)\s*\.\s*Rd/gi)].map((m) =>
    parseInt(m[1], 10),
  );
  const rounds = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;

  const dateMatch = text.match(
    /(\d{4}\/\d{2}\/\d{2})\s*(?:to|s\.?d\.?|-)\s*(\d{4}\/\d{2}\/\d{2})/i,
  );
  const startDate = dateMatch?.[1];
  const endDate = dateMatch?.[2];

  return {
    name,
    startDate,
    endDate,
    rounds,
  };
}

// ─── Parse Player List ─────────────────────────────────────────────────

export function parsePlayerList(html: string): ChessResultsPlayer[] {
  const rows = extractTableRows(html);
  if (rows.length === 0) {
    throw new ChessResultsError(
      "Gagal membaca data pemain — tabel tidak ditemukan",
      "PARSE",
    );
  }

  // The header row is the first row with a "Name" column alongside a
  // rating/federation column — distinguishes it from search boxes or
  // navigation rows that also contain the word "name".
  const headerIdx = rows.findIndex(
    (row) =>
      findColumn(row, /name|nama|nimi/i) >= 0 &&
      (findColumn(row, /^fed$/i) >= 0 ||
        findColumn(row, /^(rtg|rating|elo)$/i) >= 0),
  );
  if (headerIdx < 0) {
    throw new ChessResultsError(
      "Gagal membaca data pemain — header tabel tidak ditemukan",
      "PARSE",
    );
  }

  const header = rows[headerIdx];
  // Real chess-results layout: Rk. | SNo | (flag) | Name | FED | Rtg | Club/City
  const nameCol = findColumn(header, /name|nama|nimi/i);
  const noCol = findColumn(header, /^(sno|nr\.?|no\.?)$/i);
  const startCol = noCol >= 0 ? noCol : findColumn(header, /^rk\.?$/i);
  const fedCol = findColumn(header, /^fed$/i);
  const rtgCol = findColumn(header, /^(rtg|rating|elo)$/i);
  const clubCol = findColumn(header, /club|city|kerho|kaupunki|verein/i);

  const dataRows = rows.slice(headerIdx + 1);
  const players: ChessResultsPlayer[] = [];

  for (const row of dataRows) {
    if (row.length <= nameCol) continue;

    const startNo = parseInt(row[startCol] ?? "", 10);
    if (isNaN(startNo)) continue;

    const name = cleanName(row[nameCol] ?? "");
    if (!name) continue;

    const federation = fedCol >= 0 ? row[fedCol] || undefined : undefined;
    const ratingRaw = rtgCol >= 0 ? parseInt(row[rtgCol] ?? "", 10) : NaN;
    const rating = isNaN(ratingRaw) || ratingRaw === 0 ? undefined : ratingRaw;
    const club = clubCol >= 0 ? row[clubCol] || undefined : undefined;

    players.push({ startNo, name, federation, rating, club });
  }

  if (players.length === 0) {
    throw new ChessResultsError(
      "Gagal membaca data pemain — format tabel tidak dikenali",
      "PARSE",
    );
  }

  return players;
}

// ─── Parse Pairings ────────────────────────────────────────────────────

export function parsePairings(
  html: string,
  _roundNumber?: number,
): ChessResultsPairing[] {
  const rows = extractTableRows(html);
  if (rows.length === 0) {
    return []; // No pairings yet for this round — not an error
  }

  // The header row is the first row containing both "White" and "Black".
  const headerIdx = rows.findIndex(
    (row) =>
      findColumn(row, /white|putih|valkea/i) >= 0 &&
      findColumn(row, /black|hitam|musta/i) >= 0,
  );

  const header = headerIdx >= 0 ? rows[headerIdx] : [];
  // Real layout: Bo. | No. | (flag) | White | Rtg | Pts. | Result | Pts. | (flag) | Black | Rtg | No.
  const boardCol =
    headerIdx >= 0 ? findColumn(header, /^(bo\.?|board|papan|meja)$/i) : 0;
  const whiteCol = headerIdx >= 0 ? findColumn(header, /white|putih|valkea/i) : 1;
  const blackCol = headerIdx >= 0 ? findColumn(header, /black|hitam|musta/i) : 2;
  const resultCol =
    headerIdx >= 0 ? findColumn(header, /result|hasil|tulos/i) : 3;

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  const pairings: ChessResultsPairing[] = [];

  for (const row of dataRows) {
    const maxCol = Math.max(boardCol, whiteCol, blackCol);
    if (row.length <= maxCol) continue;

    const table = parseInt(row[boardCol] ?? "", 10);
    if (isNaN(table)) continue;

    const whiteName = cleanName(row[whiteCol] ?? "");
    const blackName = cleanName(row[blackCol] ?? "");

    // Detect BYE
    const isBye = /bye|spielfrei|lewat/i.test(blackName) || blackName === "";
    const result =
      resultCol >= 0 ? row[resultCol]?.trim() || undefined : undefined;

    pairings.push({
      table,
      whiteName,
      blackName: isBye ? "BYE" : blackName,
      result,
    });
  }

  return pairings;
}

// ─── Parse Cross Table ─────────────────────────────────────────────────

export function parseCrossTable(html: string): ChessResultsResult[] {
  const rows = extractTableRows(html);
  if (rows.length === 0) {
    throw new ChessResultsError(
      "Gagal membaca cross table — tabel tidak ditemukan",
      "PARSE",
    );
  }

  // Cross table header has round columns rendered as "1.Rd", "2.Rd", …
  // (also tolerate "Rd.1" / "Ronde 1" from other layouts).
  const matchRoundCol = (cell: string): number | null => {
    const m =
      cell.match(/^(\d+)\s*\.?\s*Rd\b/i) ||
      cell.match(/^Rd\.?\s*(\d+)$/i) ||
      cell.match(/^ronde\s*(\d+)$/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const headerIdx = rows.findIndex(
    (row) =>
      findColumn(row, /name|nama|nimi/i) >= 0 &&
      row.some((cell) => matchRoundCol(cell) !== null),
  );

  if (headerIdx < 0) {
    throw new ChessResultsError(
      "Gagal membaca cross table — header ronde tidak ditemukan",
      "PARSE",
    );
  }

  const headerRow = rows[headerIdx];
  const nameCol = findColumn(headerRow, /name|nama|nimi/i);
  const roundCols: number[] = [];
  const roundColNumber: number[] = [];
  for (let i = 0; i < headerRow.length; i++) {
    const roundNum = matchRoundCol(headerRow[i]);
    if (roundNum !== null) {
      roundCols.push(i);
      roundColNumber.push(roundNum);
    }
  }

  const results: ChessResultsResult[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length <= nameCol) continue;

    const playerName = cleanName(row[nameCol]);
    if (!playerName) continue;

    const roundResults: ChessResultsRoundResult[] = [];

    for (let colIdx = 0; colIdx < roundCols.length; colIdx++) {
      const col = roundCols[colIdx];
      if (col >= row.length) continue;

      const cell = row[col];
      if (!cell || cell === "-" || cell === "") continue;

      const roundNum = roundColNumber[colIdx];
      const parsed = parseSingleCrossResult(cell);

      roundResults.push({
        round: roundNum,
        result: parsed.result,
        opponentName: parsed.opponentName,
        color: parsed.color,
      });
    }

    if (roundResults.length > 0) {
      results.push({ playerName, roundResults });
    }
  }

  return results;
}

/** Map a raw cross-table result char to the canonical result type. */
function normalizeCrossResult(
  raw: string | undefined,
): "1" | "0" | "½" | "" | "+" | "-" {
  switch (raw) {
    case "1":
    case "0":
    case "½":
    case "+":
    case "-":
      return raw;
    default:
      return "";
  }
}

/** Parse a single cross-table cell like "18w1", "3b0", "36b-", "4w" */
function parseSingleCrossResult(cell: string): {
  result: "1" | "0" | "½" | "" | "+" | "-";
  opponentName?: string;
  color?: "W" | "B";
} {
  const clean = cell.trim();

  // chess-results cross-table cell: "{opponentSNo}{color}{result}".
  //   "18w1" → vs #18, white, win
  //   "3w0"  → vs #3, white, loss
  //   "36b-" → vs #36, black, forfeit loss
  //   "4w"   → vs #4, white, result pending (round in progress)
  const match = clean.match(/^(\d+)\s*([wb])\s*([10½½+\-])?$/i);
  if (match) {
    return {
      result: normalizeCrossResult(match[3]),
      color: match[2].toUpperCase() as "W" | "B",
      opponentName: match[1],
    };
  }

  // "+" or "-" (bye / forfeit with no opponent)
  if (clean === "+") return { result: "+" };
  if (clean === "-") return { result: "-" };

  // Plain result like "1", "0", "½"
  if (/^[10½½]$/.test(clean)) {
    return { result: normalizeCrossResult(clean) };
  }

  return { result: "" };
}

// ─── Parse Result String ───────────────────────────────────────────────

export function parseResultString(result: string): {
  player1Score: number | null;
  player2Score: number | null;
} {
  const trimmed = result.trim();

  // 1-0
  if (/^1\s*[-–—]\s*0$/.test(trimmed)) {
    return { player1Score: 1, player2Score: 0 };
  }

  // 0-1
  if (/^0\s*[-–—]\s*1$/.test(trimmed)) {
    return { player1Score: 0, player2Score: 1 };
  }

  // ½-½
  if (/^½\s*[-–—]\s*½$/.test(trimmed)) {
    return { player1Score: 0.5, player2Score: 0.5 };
  }

  // White wins by forfeit: + - -
  if (/^\+\s*[-–—]\s*-$/.test(trimmed)) {
    return { player1Score: 1, player2Score: 0 };
  }

  // Black wins by forfeit: - - +
  if (/^-\s*[-–—]\s*\+$/.test(trimmed)) {
    return { player1Score: 0, player2Score: 1 };
  }

  return { player1Score: null, player2Score: null };
}

// ─── High-Level Import ─────────────────────────────────────────────────

export interface FullImportData {
  meta: TournamentMeta;
  players: ChessResultsPlayer[];
  pairings: Map<number, ChessResultsPairing[]>; // round → pairings
  crossTable: ChessResultsResult[];
}

/** Highest round number appearing in a parsed cross table (0 if none). */
function maxRound(crossTable: ChessResultsResult[]): number {
  let max = 0;
  for (const player of crossTable) {
    for (const r of player.roundResults) {
      if (r.round > max) max = r.round;
    }
  }
  return max;
}

/**
 * Fetch and parse all data for a tournament from chess-results.com.
 * Fetches overview (art=0), player list (art=1), cross table (art=4),
 * and pairings for each round (art=2&rd=N).
 */
export async function fetchFullTournamentData(
  tnrId: string,
): Promise<FullImportData> {
  // Fetch overview first to get round count
  const overviewHtml = await fetchTournamentPage(tnrId, 0);
  const meta = parseOverview(overviewHtml);

  // Fetch player list
  const playerHtml = await fetchTournamentPage(tnrId, 1, "zeilen=99999");
  const players = parsePlayerList(playerHtml);

  // Fetch cross table
  let crossTable: ChessResultsResult[] = [];
  try {
    const crossHtml = await fetchTournamentPage(tnrId, 4, "zeilen=99999");
    crossTable = parseCrossTable(crossHtml);
  } catch {
    // Cross table may not be available
  }

  // The overview page doesn't list the round count; derive it from the
  // cross table (highest round played) when the overview didn't provide one.
  const totalRounds = meta.rounds || maxRound(crossTable);
  meta.rounds = totalRounds;

  // Fetch pairings for each round
  const pairings = new Map<number, ChessResultsPairing[]>();
  for (let rd = 1; rd <= totalRounds; rd++) {
    // Small delay between requests (rate limiting)
    if (rd > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      const pairingHtml = await fetchTournamentPage(
        tnrId,
        2,
        `rd=${rd}&zeilen=99999`,
      );
      const roundPairings = parsePairings(pairingHtml, rd);
      pairings.set(rd, roundPairings);
    } catch {
      // Skip round if pairings not available
    }
  }

  return { meta, players, pairings, crossTable };
}
