import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { importChessResultsSchema } from "@/lib/validation/schemas";
import { fetchFullTournamentData } from "@/lib/sync/scraper";
import {
  mapPlayersToRegistrations,
  detectDuplicates,
  mapPairingsToMatches,
  buildPlayerLookupMaps,
  extractExistingNames,
} from "@/lib/sync/mapper";
import { generateRegistrationId } from "@/lib/utils/helpers";

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid" }, { status: 400 });
  }

  const parsed = importChessResultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const { url, tournamentId } = parsed.data;
  const tnrId = url.match(/tnr(\d+)/i)?.[1];
  if (!tnrId) {
    return NextResponse.json(
      { error: "URL chess-results.com tidak valid" },
      { status: 400 },
    );
  }

  const supabase = await createServiceClient();

  // Try UUID first, then tournament code
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tournamentId);
  let query = supabase.from("tournaments").select("id, status");
  query = isUuid ? query.eq("id", tournamentId) : query.eq("code", tournamentId);

  const { data: tournament, error: tournamentError } = await query.single();

  if (tournamentError || !tournament) {
    return NextResponse.json(
      { error: "Turnamen tidak ditemukan" },
      { status: 404 },
    );
  }

  if (tournament.status === "ongoing" || tournament.status === "finished") {
    return NextResponse.json(
      { error: "Turnamen sudah berjalan atau selesai — tidak bisa impor" },
      { status: 409 },
    );
  }

  // Scrape chess-results.com
  let data;
  try {
    data = await fetchFullTournamentData(tnrId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi chess-results.com";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Get existing registrations for dedup
  const { data: existing } = await supabase
    .from("registrations")
    .select("full_name")
    .eq("tournament_id", tournament.id);

  const existingNames = extractExistingNames(existing ?? []);
  const mapped = mapPlayersToRegistrations(data.players);
  const { unique, duplicates } = detectDuplicates(mapped, existingNames);

  // Generate registration IDs
  const { data: lastSeq } = await supabase
    .from("registrations")
    .select("registration_id")
    .like("registration_id", `CATUR${new Date().getFullYear()}-%`)
    .order("registration_id", { ascending: false })
    .limit(1);

  let nextSeq = 1;
  if (lastSeq?.[0]?.registration_id) {
    const match = lastSeq[0].registration_id.match(/-(\d+)$/);
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }

  // Insert players
  const importedPlayers: Array<{ id: string; full_name: string; sourceStartNo: number | null }> = [];
  const skippedPlayers = duplicates.map((d) => ({
    name: d.name,
    reason: d.reason,
  }));

  for (const player of unique) {
    const registrationId = generateRegistrationId(
      new Date().getFullYear(),
      nextSeq++,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("registrations")
      .insert({
        registration_id: registrationId,
        tournament_id: tournament.id,
        full_name: player.full_name,
        student_status: player.student_status,
        school_name: player.school_name,
        chess_rating: player.chess_rating,
        paid: true,
        is_active: true,
        email: null,
        wa_number: null,
      })
      .select("id, full_name")
      .single();

    if (insertError) {
      skippedPlayers.push({
        name: player.full_name,
        reason: "gagal insert: " + insertError.message,
      });
      continue;
    }

    importedPlayers.push({
      id: inserted.id,
      full_name: inserted.full_name,
      sourceStartNo: player.sourceStartNo,
    });
  }

  // Build lookup maps for match insertion
  const { nameToId, startNoToId } = buildPlayerLookupMaps(
    importedPlayers,
    data.players,
  );

  // Insert rounds and matches
  let roundsImported = 0;
  let matchesImported = 0;

  // Sort pairings by round number
  const roundNumbers = Array.from(data.pairings.keys()).sort((a, b) => a - b);

  for (const roundNum of roundNumbers) {
    const pairings = data.pairings.get(roundNum) ?? [];
    if (pairings.length === 0) continue;

    // Create round
    const { data: round, error: roundError } = await supabase
      .from("tournament_rounds")
      .insert({
        tournament_id: tournament.id,
        round_number: roundNum,
        status: "ongoing",
      })
      .select("id")
      .single();

    if (roundError) continue;

    // Map pairings to matches
    const matchInserts = mapPairingsToMatches(pairings, nameToId, startNoToId);

    const validMatches = matchInserts
      .filter((m) => m.player1_id && m.player1_id.length > 5);

    if (validMatches.length === 0) continue;

    const { error: matchError } = await supabase
      .from("matches")
      .insert(
        validMatches.map((m) => ({
          round_id: round.id,
          player1_id: m.player1_id,
          player2_id: m.player2_id,
          table_no: m.table_no,
          player1_score: m.player1_score,
          player2_score: m.player2_score,
          status: m.status,
        })),
      );

    if (!matchError) {
      roundsImported++;
      matchesImported += validMatches.length;
    }
  }

  return NextResponse.json({
    imported: {
      players: importedPlayers.length,
      rounds: roundsImported,
      matches: matchesImported,
    },
    skipped: {
      players: skippedPlayers,
    },
  });
}
