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
  const params = [`lan=18`, `art=${art}`];
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

// ─── Parse Overview ────────────────────────────────────────────────────

export function parseOverview(html: string): TournamentMeta {
  const text = cleanText(stripTags(html));

  // Name comes after "Tournament selection:" and before the next key field
  const nameMatch = text.match(
    /Tournament selection:\s*(.+?)\s*(?:Rounds|Ronden|Date|Tanggal|Federation|City|Kota|Arbiter|Wasit)\s*:?\s*\d/i,
  );
  let name = nameMatch?.[1]?.trim() ?? "";

  // Fallback: simpler match when boundary keywords aren't present
  if (!name) {
    const simpleMatch = text.match(/Tournament selection:\s*(.+?)(?:\n|$)/i);
    name = simpleMatch?.[1]?.trim() ?? "Unknown Tournament";
  }

  const roundsMatch = text.match(/(?:Rounds|Ronden)\s*:?\s*(\d+)/i);
  const rounds = roundsMatch ? parseInt(roundsMatch[1], 10) : 0;

  const fedMatch = text.match(/Federation\s*:?\s*([A-Z]{3})/i);
  const federation = fedMatch?.[1];

  const dateMatch = text.match(
    /(?:Date|Tanggal)\s*:?\s*(\d{4}\/\d{2}\/\d{2})\s*(?:to|s\.?d\.?|-\s*)\s*(\d{4}\/\d{2}\/\d{2})/i,
  );
  const startDate = dateMatch?.[1];
  const endDate = dateMatch?.[2];

  const arbiterMatch = text.match(/(?:Arbiter|Wasit)\s*:?\s*(.+?)(?:\n|$)/i);
  const arbiter = arbiterMatch?.[1]?.trim();

  const cityMatch = text.match(/(?:City|Kota|Ort)\s*:?\s*(.+?)(?:\n|$)/i);
  const city = cityMatch?.[1]?.trim();

  return {
    name,
    federation,
    startDate,
    endDate,
    rounds,
    arbiter,
    city,
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

  // Find header row to determine column mapping
  const headerIdx = rows.findIndex((row) =>
    row.some(
      (cell) =>
        /no/i.test(cell) ||
        /name|nama/i.test(cell) ||
        /fed/i.test(cell) ||
        /rtg|rating/i.test(cell),
    ),
  );

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  const players: ChessResultsPlayer[] = [];

  for (const row of dataRows) {
    if (row.length < 2) continue;

    const startNo = parseInt(row[0], 10);
    if (isNaN(startNo)) continue;

    const name = row[1];
    if (!name) continue;

    const federation = row[2] || undefined;
    const ratingRaw = parseInt(row[3], 10);
    const rating = isNaN(ratingRaw) ? undefined : ratingRaw;
    const club = row[4] || undefined;

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
  roundNumber: number,
): ChessResultsPairing[] {
  const rows = extractTableRows(html);
  if (rows.length === 0) {
    return []; // No pairings yet for this round — not an error
  }

  const headerIdx = rows.findIndex((row) =>
    row.some(
      (cell) =>
        /bo\.|board|papan|meja/i.test(cell) ||
        /white|putih/i.test(cell) ||
        /black|hitam/i.test(cell),
    ),
  );

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  const pairings: ChessResultsPairing[] = [];

  for (const row of dataRows) {
    if (row.length < 3) continue;

    const table = parseInt(row[0], 10);
    if (isNaN(table)) continue;

    const whiteName = row[1];
    const blackName = row[2];

    // Detect BYE
    const isBye = /bye|spielfrei|lewat/i.test(blackName);
    const result = row[3] || undefined;

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

  // Cross table header typically has round numbers
  const headerIdx = rows.findIndex((row) =>
    row.some((cell) => /rd\.?\s*\d|ronde/i.test(cell)),
  );

  if (headerIdx < 0) {
    throw new ChessResultsError(
      "Gagal membaca cross table — header ronde tidak ditemukan",
      "PARSE",
    );
  }

  const headerRow = rows[headerIdx];
  // Find round columns — matches "1", "2", "Rd.1", "Rd 2", "Ronde 1"
  const roundCols: number[] = [];
  const roundColNumber: number[] = [];
  for (let i = 0; i < headerRow.length; i++) {
    const match = headerRow[i].match(/^(?:rd\.?\s*|ronde\s*)?(\d+)$/i);
    if (match) {
      roundCols.push(i);
      roundColNumber.push(parseInt(match[1], 10));
    }
  }

  const results: ChessResultsResult[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 2) continue;

    const playerName = row[1]; // Usually after rank column
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

/** Parse a single cross-table cell like "1w 5", "½b 3", "0", "+" */
function parseSingleCrossResult(cell: string): {
  result: "1" | "0" | "½" | "" | "+" | "-";
  opponentName?: string;
  color?: "W" | "B";
} {
  const clean = cell.trim();

  // "1w 5" → white win vs player 5
  const colorResultMatch = clean.match(/^([10½])\s*([wb])\s*(\d+)?/i);
  if (colorResultMatch) {
    const resultMap: Record<string, "1" | "0" | "½" | "+" | "-"> = {
      "1": "1",
      "0": "0",
      "½": "½",
    };
    return {
      result: resultMap[colorResultMatch[1]] ?? "",
      color: colorResultMatch[2].toUpperCase() as "W" | "B",
      opponentName: colorResultMatch[3],
    };
  }

  // "+" or "-" (forfeit)
  if (clean === "+") return { result: "+" };
  if (clean === "-") return { result: "-" };

  // Plain result like "1", "0", "½"
  if (/^[10½]$/.test(clean)) {
    return { result: clean as "1" | "0" | "½" };
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

  // Fetch pairings for each round
  const pairings = new Map<number, ChessResultsPairing[]>();
  for (let rd = 1; rd <= meta.rounds; rd++) {
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
