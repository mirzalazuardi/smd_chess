import type { ChessResultsPlayer, ChessResultsPairing } from "./scraper";

export interface MappedPlayer {
  full_name: string;
  student_status: "pelajar" | "umum";
  school_name: string | null;
  chess_rating: number | null;
  paid: boolean;
  is_active: boolean;
  proof_transfer_url: null;
  sourceStartNo: number;
}

export interface DuplicatePlayer {
  name: string;
  sourceStartNo: number;
  reason: string;
}

export interface MappedMatchInsert {
  player1_id: string;
  player2_id: string | null;
  table_no: number;
  player1_score: number | null;
  player2_score: number | null;
  status: "pending" | "completed";
}

export function mapPlayersToRegistrations(
  players: ChessResultsPlayer[],
): MappedPlayer[] {
  return players.map((p) => ({
    full_name: p.name,
    student_status: "umum" as const,
    school_name: p.club ?? null,
    chess_rating: p.rating ?? null,
    paid: true,
    is_active: true,
    proof_transfer_url: null,
    sourceStartNo: p.startNo,
  }));
}

export function detectDuplicates(
  newPlayers: MappedPlayer[],
  existingNames: string[],
): { unique: MappedPlayer[]; duplicates: DuplicatePlayer[] } {
  const seen = new Set(
    existingNames.map((n) => n.trim().toLowerCase()).filter(Boolean),
  );

  const unique: MappedPlayer[] = [];
  const duplicates: DuplicatePlayer[] = [];

  for (const player of newPlayers) {
    const key = player.full_name.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.push({
        name: player.full_name,
        sourceStartNo: player.sourceStartNo,
        reason: "duplikat nama",
      });
      continue;
    }
    seen.add(key);
    unique.push(player);
  }

  return { unique, duplicates };
}

export function mapPairingsToMatches(
  pairings: ChessResultsPairing[],
  nameToId: Map<string, string>,
  startNoToId: Map<number, string>,
): MappedMatchInsert[] {
  return pairings.map((p) => {
    const isBye = p.blackName === "BYE";

    const whiteId =
      startNoToId.get(p.table) ??
      nameToId.get(p.whiteName.trim().toLowerCase()) ??
      p.whiteName;

    const blackId = isBye
      ? null
      : (startNoToId.get(p.table) ??
          nameToId.get(p.blackName.trim().toLowerCase()) ??
          null);

    const hasResult = p.result != null && p.result !== "";

    return {
      player1_id: whiteId,
      player2_id: blackId,
      table_no: p.table,
      player1_score: isBye ? 1 : hasResult ? 0 : null,
      player2_score: isBye ? null : hasResult ? 0 : null,
      status: isBye || hasResult ? "completed" : "pending",
    };
  });
}

export function buildPlayerLookupMaps(
  importedPlayers: Array<{
    id: string;
    full_name: string;
    sourceStartNo?: number | null;
  }>,
  scrapedPlayers: ChessResultsPlayer[],
): { nameToId: Map<string, string>; startNoToId: Map<number, string> } {
  const nameToId = new Map<string, string>();
  const startNoToId = new Map<number, string>();

  for (const player of importedPlayers) {
    nameToId.set(player.full_name.trim().toLowerCase(), player.id);
    if (player.sourceStartNo != null) {
      startNoToId.set(player.sourceStartNo, player.id);
    }
  }

  for (const scraped of scrapedPlayers) {
    if (!startNoToId.has(scraped.startNo)) {
      const id = nameToId.get(scraped.name.trim().toLowerCase());
      if (id) startNoToId.set(scraped.startNo, id);
    }
  }

  return { nameToId, startNoToId };
}

export function extractExistingNames(
  registrations: Array<{ full_name: string }>,
): string[] {
  return registrations.map((r) => r.full_name.trim().toLowerCase());
}
