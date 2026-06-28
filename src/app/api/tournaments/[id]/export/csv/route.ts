import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { generatePlayerCSV } from "@/lib/sync/csv-export";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, code, name")
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
    .select("full_name, chess_rating, school_name, student_status")
    .eq("tournament_id", id)
    .eq("paid", true)
    .eq("is_active", true);

  if (regError || !registrations || registrations.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada peserta untuk diexport" },
      { status: 400 },
    );
  }

  const csv = generatePlayerCSV(registrations);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tournament.code}-players.csv"`,
    },
  });
}
