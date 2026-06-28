import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { chessResultsUrlSchema } from "@/lib/validation/schemas";
import {
  fetchTournamentPage,
  parseOverview,
  parsePlayerList,
  parseCrossTable,
} from "@/lib/sync/scraper";

export async function GET(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  const parsed = chessResultsUrlSchema.safeParse(url);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "URL chess-results.com tidak valid" },
      { status: 400 },
    );
  }

  const tnrId = parsed.data.match(/tnr(\d+)/i)?.[1];
  if (!tnrId) {
    return NextResponse.json(
      { error: "URL chess-results.com tidak valid" },
      { status: 400 },
    );
  }

  try {
    const overviewHtml = await fetchTournamentPage(tnrId, 0);
    const meta = parseOverview(overviewHtml);

    let playerCount = 0;
    try {
      const playerHtml = await fetchTournamentPage(tnrId, 1, "zeilen=99999");
      playerCount = parsePlayerList(playerHtml).length;
    } catch {
      // Player list may not be accessible
    }

    // The overview page doesn't list the round count — derive it from the
    // cross table (highest round played).
    let rounds = meta.rounds;
    if (!rounds) {
      try {
        const crossHtml = await fetchTournamentPage(tnrId, 4, "zeilen=99999");
        const crossTable = parseCrossTable(crossHtml);
        rounds = crossTable.reduce(
          (max, p) =>
            Math.max(max, ...p.roundResults.map((r) => r.round)),
          0,
        );
      } catch {
        // Cross table may not be accessible
      }
    }

    return NextResponse.json({
      tournamentName: meta.name,
      federation: meta.federation,
      rounds,
      playerCount,
      startDate: meta.startDate,
      endDate: meta.endDate,
      city: meta.city,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi chess-results.com";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
