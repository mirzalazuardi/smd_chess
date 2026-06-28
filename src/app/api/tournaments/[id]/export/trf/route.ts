import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { generateTRFFromSMD } from "@/lib/sync/trf-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, code, name, rounds_count")
    .eq("id", id)
    .single();

  if (tournamentError || !tournament) {
    return NextResponse.json(
      { error: "Turnamen tidak ditemukan" },
      { status: 404 },
    );
  }

  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("id, full_name, chess_rating")
    .eq("tournament_id", id)
    .eq("paid", true)
    .eq("is_active", true);

  if (regError || !registrations || registrations.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada peserta untuk diexport" },
      { status: 400 },
    );
  }

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("round_number, matches(*)")
    .eq("tournament_id", id)
    .order("round_number", { ascending: true });

  const trf = generateTRFFromSMD(
    { name: tournament.name, code: tournament.code, rounds_count: tournament.rounds_count },
    registrations,
    (rounds ?? []).map((r) => ({
      round_number: r.round_number,
      matches: (r.matches as unknown[]) ?? [],
    })) as Array<{
      round_number: number;
      matches: Array<{
        player1_id: string;
        player2_id: string | null;
        table_no: number | null;
        player1_score: number | null;
        player2_score: number | null;
      }>;
    }>,
  );

  return new NextResponse(trf, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tournament.code}.trf"`,
    },
  });
}
