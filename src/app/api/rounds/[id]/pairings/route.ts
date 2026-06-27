import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { buildPlayerHistory } from "@/lib/swiss/history";
import { validatePairings } from "@/lib/swiss/validation";
import { roundHasResults } from "@/lib/swiss/round";
import type { Pairing } from "@/lib/swiss/types";

const updatePairingsSchema = z.object({
  matches: z.array(
    z.object({
      table_no: z.number().nullable(),
      player1_id: z.string().uuid(),
      player2_id: z.string().uuid().nullable(),
    }),
  ),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roundId } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = await createServiceClient();

  try {
    const body = updatePairingsSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Data pasangan tidak valid" },
        { status: 400 },
      );
    }

    const { data: round, error: roundError } = await supabase
      .from("tournament_rounds")
      .select("*, matches(*)")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "Ronde tidak ditemukan" }, { status: 404 });
    }

    if (round.status === "completed" || roundHasResults(round.matches)) {
      return NextResponse.json(
        { error: "Ronde sudah punya hasil, tidak bisa diubah" },
        { status: 409 },
      );
    }

    const { data: registrations } = await supabase
      .from("registrations")
      .select("*")
      .eq("tournament_id", round.tournament_id)
      .eq("paid", true)
      .eq("is_active", true);

    const { data: priorRounds } = await supabase
      .from("tournament_rounds")
      .select("id, round_number, matches(*)")
      .eq("tournament_id", round.tournament_id)
      .lt("round_number", round.round_number)
      .order("round_number", { ascending: true });

    const playerMap = buildPlayerHistory(registrations ?? [], priorRounds ?? []);

    const pairings: Pairing[] = body.data.matches.map((m) => {
      const white = playerMap.get(m.player1_id);
      if (!white) throw new Error("Player not found");
      const black = m.player2_id ? playerMap.get(m.player2_id) ?? null : null;
      return { white, black, tableNo: m.table_no };
    });

    const result = validatePairings(pairings, {
      firstRound: round.round_number === 1,
      expectedPlayerIds: Array.from(playerMap.keys()),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Pasangan tidak valid", violations: result.errors },
        { status: 400 },
      );
    }

    await supabase.from("matches").delete().eq("round_id", roundId);

    const matchesToInsert = pairings.map((pair) => ({
      round_id: roundId,
      player1_id: pair.white.id,
      player2_id: pair.black?.id ?? null,
      table_no: pair.tableNo,
      status: pair.black ? "pending" : "completed",
      player1_score: pair.black ? null : 1,
      player2_score: pair.black ? null : null,
    }));

    const { data: createdMatches, error: insertError } = await supabase
      .from("matches")
      .insert(matchesToInsert)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: "Gagal menyimpan pasangan" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      round,
      matches: createdMatches,
      warnings: result.warnings,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan pasangan" },
      { status: 500 },
    );
  }
}
