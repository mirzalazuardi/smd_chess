import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roundId } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = await createServiceClient();

  try {
    const body = await request.json();
    const results = body.results as Array<{
      match_id: string;
      player1_score: number;
      player2_score: number | null;
    }>;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Data hasil pertandingan tidak valid" },
        { status: 400 },
      );
    }

    for (const r of results) {
      if (![0, 0.5, 1].includes(r.player1_score)) {
        return NextResponse.json(
          { error: "Skor harus 0, 0.5, atau 1" },
          { status: 400 },
        );
      }
    }

    for (const r of results) {
      const update: Record<string, unknown> = {
        player1_score: r.player1_score,
        status: "completed",
      };

      if (r.player2_score !== null && r.player2_score !== undefined) {
        update.player2_score = r.player2_score;
      }

      await supabase
        .from("matches")
        .update(update)
        .eq("id", r.match_id);
    }

    await supabase
      .from("tournament_rounds")
      .update({ status: "completed" })
      .eq("id", roundId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan hasil" },
      { status: 500 },
    );
  }
}
