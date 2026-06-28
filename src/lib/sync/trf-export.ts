/**
 * TRF (Tournament Report File) format exporter.
 *
 * TRF16 is the FIDE standard format for tournament data exchange.
 * Spec: FIDE C04 Annex 2.
 */

export interface TrfTournament {
  name: string;
  city?: string;
  federation: string;
  startDate?: string;
  endDate?: string;
  arbiter?: string;
}

export interface TrfPlayer {
  startNo: number;
  name: string;
  rating?: number;
  title?: string;
  federation?: string;
}

export interface TrfGame {
  table: number;
  whiteNo: number;
  blackNo: number;
  result: string;
}

export interface TrfRound {
  roundNumber: number;
  date?: string;
  games: TrfGame[];
}

function padRight(value: string, length: number): string {
  return value.padEnd(length, " ");
}

function padLeft(value: string, length: number): string {
  return value.padStart(length, " ");
}

function optionalLine(prefix: string, value: string | undefined): string {
  return value ? `${prefix} ${value}` : "";
}

function mapResultToTrf(result: string): string {
  const normalized = result.trim();
  if (/^1\s*[-–—]\s*0$/.test(normalized) || normalized === "1") return "1";
  if (/^0\s*[-–—]\s*1$/.test(normalized) || normalized === "0") return "0";
  if (/^½\s*[-–—]\s*½$/.test(normalized) || normalized === "=" || normalized === "½") return "=";
  if (/^\+\s*[-–—]\s*-$/.test(normalized) || normalized === "+") return "+";
  if (/^-\s*[-–—]\s*\+$/.test(normalized) || normalized === "-") return "-";
  return "";
}

export function generateTRF(
  tournament: TrfTournament,
  players: TrfPlayer[],
  rounds: TrfRound[],
): string {
  const lines: string[] = [];

  // Header
  lines.push(`012 ${tournament.name}`);
  lines.push(optionalLine("022", tournament.city));
  lines.push(`032 ${tournament.federation}`);
  if (tournament.startDate) {
    const dates = tournament.endDate
      ? `${tournament.startDate} ${tournament.endDate}`
      : tournament.startDate;
    lines.push(`042 ${dates}`);
  }
  lines.push(optionalLine("062", tournament.arbiter));
  lines.push(`092 ${players.length}`);
  lines.push(`102 ${rounds.length}`);
  lines.push(`132 ${tournament.federation}`);

  // Players section (XXR)
  lines.push(`XXR   ${players.length}`);

  for (const player of players) {
    const rating = player.rating ?? 0;
    const title = player.title ?? "";
    const name = player.name;
    const fed = player.federation ?? tournament.federation;

    const line =
      `001  ${padLeft(String(player.startNo), 4)}  ` +
      `${padLeft(String(rating), 4)}  ` +
      `${padRight(title, 3)} ` +
      `${padRight(name, 33)} ` +
      `${fed}`;
    lines.push(line);
  }

  lines.push(`XXR   ${players.length}`);

  // Rounds section
  for (const round of rounds) {
    const datePart = round.date ? `  ${round.date}` : "";
    lines.push(`RD  ${round.roundNumber}${datePart}`);

    for (const game of round.games) {
      const resultCode = mapResultToTrf(game.result);

      if (game.whiteNo === 0 || game.blackNo === 0) {
        // BYE
        const playerNo = game.whiteNo || game.blackNo;
        lines.push(
          ` ${padLeft(String(game.table), 2)}  ` +
            `${padLeft(String(playerNo), 4)}  0000  bye`,
        );
      } else {
        lines.push(
          ` ${padLeft(String(game.table), 2)}  ` +
            `${padLeft(String(game.whiteNo), 4)}  ` +
            `${padLeft(String(game.blackNo), 4)}  ` +
            `${resultCode}`,
        );
      }
    }
  }

  return lines.filter(Boolean).join("\n") + "\n";
}

// ─── SMD-to-TRF bridge ────────────────────────────────────────────────

function scoreToResult(
  player1Score: number | null,
  player2Score: number | null,
): string {
  if (player1Score === null || player2Score === null) return "";
  if (player1Score === 1 && player2Score === 0) return "1";
  if (player1Score === 0 && player2Score === 1) return "0";
  if (player1Score === 0.5 && player2Score === 0.5) return "=";
  return "";
}

export function generateTRFFromSMD(
  tournament: {
    name: string;
    code: string;
    rounds_count: number;
  },
  registrations: Array<{
    id: string;
    full_name: string;
    chess_rating: number | null;
  }>,
  rounds: Array<{
    round_number: number;
    matches: Array<{
      player1_id: string;
      player2_id: string | null;
      table_no: number | null;
      player1_score: number | null;
      player2_score: number | null;
    }>;
  }>,
): string {
  // Build player ID → start number map
  const playerMap = new Map<string, number>();
  const players: TrfPlayer[] = registrations.map((reg, index) => {
    const startNo = index + 1;
    playerMap.set(reg.id, startNo);
    return {
      startNo,
      name: reg.full_name,
      rating: reg.chess_rating ?? undefined,
      federation: "INA",
    };
  });

  const trfRounds: TrfRound[] = rounds.map((round) => {
    const games: TrfGame[] = round.matches.map((match) => {
      const whiteNo = playerMap.get(match.player1_id) ?? 0;
      const blackNo = match.player2_id
        ? (playerMap.get(match.player2_id) ?? 0)
        : 0;
      const result = scoreToResult(match.player1_score, match.player2_score);

      return {
        table: match.table_no ?? 0,
        whiteNo,
        blackNo,
        result,
      };
    });

    return {
      roundNumber: round.round_number,
      games,
    };
  });

  return generateTRF(
    {
      name: tournament.name,
      federation: "INA",
      city: "Sumedang",
    },
    players,
    trfRounds,
  );
}
