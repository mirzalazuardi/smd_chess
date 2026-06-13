import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { AutoRefresh } from "@/components/ui/auto-refresh";

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
  params: Promise<{ code: string }>;
}

export default async function JadwalPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, code, name")
    .eq("code", code)
    .single();

  if (!tournament) notFound();

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("id, round_number, status, matches(*)")
    .eq("tournament_id", tournament.id)
    .order("round_number", { ascending: true });

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name")
    .eq("tournament_id", tournament.id)
    .eq("paid", true)
    .eq("is_active", true);

  const nameMap = new Map(registrations?.map((r) => [r.id, r.full_name]) ?? []);

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {tournament.name}
      </h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-gray-500 font-mono">{tournament.code}</p>
        <AutoRefresh intervalSeconds={30} />
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          Belum ada jadwal pertandingan.
        </div>
      ) : (
        <div className="space-y-6">
          {(rounds as RoundRow[]).map((round) => (
            <div key={round.id} className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900">
                  Ronde {round.round_number}
                  {round.status === "completed" && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      Selesai
                    </span>
                  )}
                  {round.status === "ongoing" && (
                    <span className="ml-2 text-xs text-blue-600 font-normal">
                      Berlangsung
                    </span>
                  )}
                </h2>
              </div>

              <div className="p-4">
                {round.matches?.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-medium text-right w-[40%]">
                      {nameMap.get(match.player1_id) ?? match.player1_id.slice(0, 8)}
                    </span>

                    <span className="font-mono text-center w-[20%]">
                      {match.player2_id ? (
                        match.status === "completed"
                          ? `${match.player1_score ?? "-"} - ${match.player2_score ?? "-"}`
                          : "vs"
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          BYE
                        </span>
                      )}
                    </span>

                    <span className="font-medium w-[40%]">
                      {match.player2_id
                        ? nameMap.get(match.player2_id) ?? match.player2_id.slice(0, 8)
                        : "-"}
                    </span>
                  </div>
                )) ?? (
                  <p className="text-sm text-gray-400">Belum ada pertandingan.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
