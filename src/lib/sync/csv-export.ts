function escapeCSV(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generatePlayerCSV(
  registrations: Array<{
    full_name: string;
    chess_rating: number | null;
    school_name: string | null;
    student_status: string;
  }>,
): string {
  const header = ["no", "nama", "rating", "status", "sekolah"];
  const rows = registrations.map((reg, i) => [
    String(i + 1),
    reg.full_name,
    reg.chess_rating != null ? String(reg.chess_rating) : "",
    reg.student_status,
    reg.school_name ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n") + "\n";
}

export function generatePairingCSV(
  rounds: Array<{
    round_number: number;
    matches: Array<{
      table_no: number | null;
      player1_id: string;
      player2_id: string | null;
      player1_score: number | null;
      player2_score: number | null;
    }>;
  }>,
  playerMap: Map<string, string>,
): string {
  const header = ["ronde", "meja", "putih", "hitam", "hasil"];
  const rows: string[][] = [];

  for (const round of rounds) {
    if (rows.length > 0) rows.push([]); // blank separator between rounds

    for (const match of round.matches) {
      const whiteName = playerMap.get(match.player1_id) ?? "?";
      const blackName = match.player2_id
        ? (playerMap.get(match.player2_id) ?? "?")
        : "BYE";

      let result = "";
      if (match.player1_score != null && match.player2_score != null) {
        result = `${match.player1_score}-${match.player2_score}`;
      } else if (match.player2_id === null && match.player1_score === 1) {
        result = "1-0 (bye)";
      }

      rows.push([
        String(round.round_number),
        match.table_no != null ? String(match.table_no) : "-",
        whiteName,
        blackName,
        result,
      ]);
    }
  }

  return [header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n") + "\n";
}

export function generateStandingsCSV(
  standings: Array<{
    rank: number;
    name: string;
    rating?: number;
    points: number;
    buchholz: number;
  }>,
): string {
  const header = ["peringkat", "nama", "rating", "poin", "buchholz"];
  const rows = standings.map((s) => [
    String(s.rank),
    s.name,
    s.rating != null ? String(s.rating) : "",
    String(s.points),
    String(s.buchholz),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n") + "\n";
}
