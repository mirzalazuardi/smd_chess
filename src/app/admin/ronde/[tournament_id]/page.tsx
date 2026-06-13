import Link from "next/link";
import { createServiceClient } from "@/lib/db/server";
import { GeneratePairingsButton } from "@/components/ui/generate-pairings-button";
import { ResultInputForm } from "@/components/ui/result-input-form";

interface MatchRow {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
}

interface RoundRow {
  id: string;
  round_number: number;
  status: string;
  matches: MatchRow[] | null;
}

interface Props {
  params: Promise<{ tournament_id: string }>;
}

export default async function RoundDetailPage({ params }: Props) {
  const { tournament_id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("code, name, rounds_count")
    .eq("id", tournament_id)
    .single();

  if (!tournament) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        Turnamen tidak ditemukan.
      </div>
    );
  }

  const { data } = await supabase
    .from("tournament_rounds")
    .select("*, matches(*)")
    .eq("tournament_id", tournament_id)
    .order("round_number", { ascending: true });

  const rounds = (data as RoundRow[]) ?? [];

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name")
    .eq("tournament_id", tournament_id)
    .eq("paid", true)
    .eq("is_active", true);

  const nameMap = new Map(registrations?.map((r) => [r.id, r.full_name]) ?? []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/admin/ronde"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Kembali
        </Link>
        <span className="text-gray-300">|</span>
        <p className="text-sm text-gray-500 font-mono">{tournament.code}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rounds?.length ?? 0} dari {tournament.rounds_count} ronde
          </p>
        </div>

        {(!rounds || rounds.length < tournament.rounds_count) && (
          <GeneratePairingsButton tournamentId={tournament_id} />
        )}
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border rounded-lg">
          Belum ada ronde. Klik &ldquo;Generate Pairing&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900">
                  Ronde {round.round_number}
                </h2>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    round.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : round.status === "ongoing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {round.status === "completed"
                    ? "Selesai"
                    : round.status === "ongoing"
                      ? "Berlangsung"
                      : "Pending"}
                </span>
              </div>

              <div className="p-4">
                {round.matches?.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-4 py-2 text-sm"
                  >
                    <span className="font-medium min-w-[150px] text-right">
                      {nameMap.get(match.player1_id) ??
                        match.player1_id.slice(0, 8)}
                    </span>

                    {match.player2_id ? (
                      <>
                        <span className="font-mono text-gray-600">
                          {match.status === "completed"
                            ? `${match.player1_score ?? "-"} - ${match.player2_score ?? "-"}`
                            : "vs"}
                        </span>
                        <span className="font-medium min-w-[150px]">
                          {nameMap.get(match.player2_id) ??
                            match.player2_id.slice(0, 8)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">
                        BYE ({match.player1_score ?? "-"})
                      </span>
                    )}
                  </div>
                ))}

                {round.status === "ongoing" && (
                  <div className="mt-4 pt-4 border-t">
                    <ResultInputForm
                      roundId={round.id}
                      matches={round.matches?.map((m) => ({
                        ...m,
                        white_name: nameMap.get(m.player1_id),
                        black_name: m.player2_id
                          ? nameMap.get(m.player2_id)
                          : undefined,
                      })) ?? []}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
