import Link from "next/link";
import { createServiceClient } from "@/lib/db/server";
import { GeneratePairingsButton } from "@/components/ui/generate-pairings-button";
import { ResultInputForm } from "@/components/ui/result-input-form";
import { PairingEditor } from "@/components/ui/pairing-editor";
import { buildPlayerHistory } from "@/lib/swiss/history";
import { roundHasResults } from "@/lib/swiss/round";

interface MatchRow {
  id: string;
  player1_id: string;
  player2_id: string | null;
  table_no: number | null;
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
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400">
        Turnamen tidak ditemukan.
      </div>
    );
  }

  const { data } = await supabase
    .from("tournament_rounds")
    .select("*, matches(*)")
    .eq("tournament_id", tournament_id)
    .order("round_number", { ascending: true });

  const rounds = (data as RoundRow[] | null)?.map((round) => ({
    ...round,
    matches: round.matches
      ? [...round.matches].sort((a, b) => {
          if (a.table_no === null) return 1;
          if (b.table_no === null) return -1;
          return (a.table_no ?? 0) - (b.table_no ?? 0);
        })
      : null,
  })) ?? [];

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name, chess_rating")
    .eq("tournament_id", tournament_id)
    .eq("paid", true)
    .eq("is_active", true);

  const nameMap = new Map(registrations?.map((r) => [r.id, r.full_name]) ?? []);

  function computePlayers(forRoundNumber: number) {
    const priorRounds = rounds.filter((r) => r.round_number < forRoundNumber);
    return Array.from(
      buildPlayerHistory(
        (registrations ?? []).map((r) => ({
          id: r.id,
          full_name: r.full_name,
          chess_rating: r.chess_rating ?? null,
        })),
        priorRounds.map((r) => ({
          id: r.id,
          round_number: r.round_number,
          matches: (r.matches ?? []).map((m) => ({
            player1_id: m.player1_id,
            player2_id: m.player2_id,
            player1_score: m.player1_score,
            player2_score: m.player2_score,
          })),
        })),
      ).values(),
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/admin/ronde"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Kembali
        </Link>
        <span className="text-gray-500">|</span>
        <p className="text-sm text-gray-500 font-mono">{tournament.code}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tournament.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rounds?.length ?? 0} dari {tournament.rounds_count} ronde
          </p>
        </div>

        {(!rounds || rounds.length < tournament.rounds_count) && (
          <GeneratePairingsButton tournamentId={tournament_id} />
        )}
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border rounded-lg">
          Belum ada ronde. Klik &ldquo;Generate Pairing&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => {
            const hasResults = roundHasResults(round.matches);
            const isEditable =
              round.status !== "completed" && !hasResults;

            return (
            <div
              key={round.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
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
                {isEditable && (
                  <div className="mb-4">
                    <PairingEditor
                      roundId={round.id}
                      roundNumber={round.round_number}
                      matches={
                        round.matches?.map((m) => ({
                          ...m,
                          white_name:
                            nameMap.get(m.player1_id) ??
                            m.player1_id.slice(0, 8),
                          black_name: m.player2_id
                            ? nameMap.get(m.player2_id) ??
                              m.player2_id.slice(0, 8)
                            : null,
                        })) ?? []
                      }
                      players={computePlayers(round.round_number)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-600 mb-2">
                  <span className="min-w-[40px] text-center">Meja</span>
                  <span className="min-w-[150px] text-right">Putih</span>
                  <span className="min-w-[60px] text-center">Hasil</span>
                  <span className="min-w-[150px]">Hitam</span>
                </div>

                {round.matches?.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-4 py-2 text-sm"
                  >
                    <span className="min-w-[40px] text-center font-mono font-bold text-gray-900 dark:text-gray-100">
                      {match.table_no ?? "-"}
                    </span>

                    <span className="font-medium min-w-[150px] text-right text-gray-900 dark:text-gray-100">
                      {nameMap.get(match.player1_id) ??
                        match.player1_id.slice(0, 8)}
                    </span>

                    {match.player2_id ? (
                      <>
                        <span className="font-mono text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
                          {match.status === "completed"
                            ? `${match.player1_score ?? "-"} - ${match.player2_score ?? "-"}`
                            : "vs"}
                        </span>
                        <span className="font-medium min-w-[150px] text-gray-900 dark:text-gray-100">
                          {nameMap.get(match.player2_id) ??
                            match.player2_id.slice(0, 8)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 italic min-w-[60px] text-center">
                        BYE
                      </span>
                    )}
                  </div>
                ))}

                {round.status === "ongoing" && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
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
          );
          })}
        </div>
      )}
    </div>
  );
}
