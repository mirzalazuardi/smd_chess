import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { generateSwissPairings } from "@/lib/swiss/pairing";
import type { Player } from "@/lib/swiss/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tournament_rounds")
    .select("*, matches(*)")
    .eq("tournament_id", id)
    .order("round_number", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data ronde" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tournamentId } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = await createServiceClient();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("paid", true)
    .eq("is_active", true);

  if (!registrations || registrations.length < 2) {
    return NextResponse.json(
      { error: "Minimal 2 peserta terdaftar dan sudah lunas" },
      { status: 400 },
    );
  }

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("round_number")
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: false })
    .limit(1);

  const nextRoundNumber = (rounds?.[0]?.round_number ?? 0) + 1;

  if (nextRoundNumber > 1) {
    const { data: prevRound } = await supabase
      .from("tournament_rounds")
      .select("status")
      .eq("tournament_id", tournamentId)
      .eq("round_number", nextRoundNumber - 1)
      .single();

    if (prevRound && prevRound.status !== "completed") {
      return NextResponse.json(
        { error: "Ronde sebelumnya belum selesai" },
        { status: 400 },
      );
    }
  }

  const { data: allMatches } = await supabase
    .from("tournament_rounds")
    .select("id, matches(*)")
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: true });

  const playerScores = new Map<string, number>();
  const playerOpponents = new Map<string, string[]>();
  const playerLastColor = new Map<string, "W" | "B" | null>();

  for (const reg of registrations) {
    playerScores.set(reg.id, 0);
    playerOpponents.set(reg.id, []);
    playerLastColor.set(reg.id, null);
  }

  for (const round of allMatches ?? []) {
    for (const match of round.matches ?? []) {
      if (match.player1_score !== null) {
        playerScores.set(
          match.player1_id,
          (playerScores.get(match.player1_id) ?? 0) + (match.player1_score ?? 0),
        );
        playerLastColor.set(match.player1_id, "W");
      }
      if (match.player2_id && match.player2_score !== null) {
        playerScores.set(
          match.player2_id,
          (playerScores.get(match.player2_id) ?? 0) + (match.player2_score ?? 0),
        );
        playerLastColor.set(match.player2_id, "B");
      }
      if (match.player2_id) {
        playerOpponents.get(match.player1_id)?.push(match.player2_id);
        playerOpponents.get(match.player2_id)?.push(match.player1_id);
      }
    }
  }

  const players: Player[] = registrations.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    chess_rating: r.chess_rating ?? 0,
    score: playerScores.get(r.id) ?? 0,
    opponentIds: playerOpponents.get(r.id) ?? [],
    lastColor: playerLastColor.get(r.id) ?? null,
    hadBye: false,
  }));

  const pairings = generateSwissPairings(players);

  const { data: round, error: roundError } = await supabase
    .from("tournament_rounds")
    .insert({
      tournament_id: tournamentId,
      round_number: nextRoundNumber,
      status: "ongoing",
    })
    .select()
    .single();

  if (roundError) {
    return NextResponse.json(
      { error: "Gagal membuat ronde" },
      { status: 500 },
    );
  }

  const matchesToInsert = pairings.map((pair) => ({
    round_id: round.id,
    player1_id: pair.white.id,
    player2_id: pair.black?.id ?? null,
    table_no: pair.tableNo,
    status: pair.black ? "pending" : "completed",
    player1_score: pair.black ? null : 1,
    player2_score: pair.black ? null : null,
  }));

  const { data: createdMatches, error: matchError } = await supabase
    .from("matches")
    .insert(matchesToInsert)
    .select();

  if (matchError) {
    return NextResponse.json(
      { error: "Gagal membuat pasangan" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ...round, matches: createdMatches },
    { status: 201 },
  );
}
