import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { calculateStandings } from "@/lib/swiss/standings";
import type { Player } from "@/lib/swiss/types";
import { AutoRefresh } from "@/components/ui/auto-refresh";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function KlasemenPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, code, name")
    .eq("code", code)
    .single();

  if (!tournament) notFound();

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name, chess_rating")
    .eq("tournament_id", tournament.id)
    .eq("paid", true)
    .eq("is_active", true);

  if (!registrations || registrations.length === 0) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {tournament.name}
        </h1>
        <p className="text-sm text-gray-500 font-mono mb-8">
          {tournament.code}
        </p>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
          Belum ada peserta terdaftar.
        </div>
      </main>
    );
  }

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("id, round_number, matches(*)")
    .eq("tournament_id", tournament.id);

  const latestRound = rounds?.length
    ? rounds.reduce((max, r) => (r.round_number > max.round_number ? r : max), rounds[0])
    : null;

  interface SupabaseMatch {
    id: string;
    player1_id: string;
    player2_id: string | null;
    player1_score: number | null;
    player2_score: number | null;
    status: string;
  }

  const playerScores = new Map<string, number>();
  const playerOpponents = new Map<string, Set<string>>();
  const playerLastColor = new Map<string, "W" | "B" | null>();
  const allMatches: Array<{ playerIds: [string, string | null]; results: [number, number | null] }> = [];

  for (const reg of registrations) {
    playerScores.set(reg.id, 0);
    playerOpponents.set(reg.id, new Set());
    playerLastColor.set(reg.id, null);
  }

  for (const round of rounds ?? []) {
    const matches = (round.matches ?? []) as unknown as SupabaseMatch[];
    for (const match of matches) {
      if (match.status !== "completed") continue;

      if (match.player2_id) {
        allMatches.push({
          playerIds: [match.player1_id, match.player2_id],
          results: [match.player1_score ?? 0, match.player2_score ?? 0],
        });
        playerOpponents.get(match.player1_id)?.add(match.player2_id);
        playerOpponents.get(match.player2_id)?.add(match.player1_id);
        playerLastColor.set(match.player1_id, "W");
        playerLastColor.set(match.player2_id, "B");
      } else {
        allMatches.push({
          playerIds: [match.player1_id, null],
          results: [match.player1_score ?? 0, null],
        });
        playerLastColor.set(match.player1_id, "W");
      }

      playerScores.set(
        match.player1_id,
        (playerScores.get(match.player1_id) ?? 0) + (match.player1_score ?? 0),
      );
      if (match.player2_id) {
        playerScores.set(
          match.player2_id,
          (playerScores.get(match.player2_id) ?? 0) + (match.player2_score ?? 0),
        );
      }
    }
  }

  const players: Player[] = registrations.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    chess_rating: r.chess_rating ?? 0,
    score: playerScores.get(r.id) ?? 0,
    opponentIds: [...(playerOpponents.get(r.id) ?? [])],
    lastColor: playerLastColor.get(r.id) ?? null,
    hadBye: false,
  }));

  const standings = calculateStandings(players, allMatches);

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {tournament.name}
      </h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-gray-500 font-mono">{tournament.code}</p>
        <AutoRefresh intervalSeconds={30} />
      </div>

      {latestRound && (
        <div className="mb-4">
          <Link
            href={`/pairing/${tournament.code}/${latestRound.round_number}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Lihat Pairing Ronde {latestRound.round_number} &rarr;
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-center px-2 sm:px-3 py-3 font-medium text-gray-600 w-8 sm:w-10">
                #
              </th>
              <th className="text-left px-2 sm:px-3 py-3 font-medium text-gray-600">
                Nama
              </th>
              <th className="text-center px-2 sm:px-3 py-3 font-medium text-gray-600">
                Poin
              </th>
              <th className="text-center px-2 py-3 font-medium text-gray-600 hidden sm:table-cell">
                M
              </th>
              <th className="text-center px-2 py-3 font-medium text-gray-600 hidden sm:table-cell">
                S
              </th>
              <th className="text-center px-2 py-3 font-medium text-gray-600 hidden sm:table-cell">
                K
              </th>
              <th className="text-center px-2 sm:px-3 py-3 font-medium text-gray-600 hidden sm:table-cell">
                BH
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {standings.map((entry) => (
              <tr
                key={entry.playerId}
                className={entry.rank <= 3 ? "bg-yellow-50 dark:bg-yellow-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
              >
                <td className="text-center px-2 sm:px-3 py-3 font-bold">
                  {entry.rank}
                </td>
                <td className="px-2 sm:px-3 py-3 font-medium truncate max-w-[200px]">
                  {entry.fullName}
                </td>
                <td className="text-center px-2 sm:px-3 py-3 font-mono font-bold">
                  {entry.score}
                </td>
                <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                  {entry.wins}
                </td>
                <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                  {entry.draws}
                </td>
                <td className="text-center px-2 py-3 text-gray-600 hidden sm:table-cell">
                  {entry.losses}
                </td>
                <td className="text-center px-2 sm:px-3 py-3 font-mono text-gray-500 hidden sm:table-cell">
                  {entry.buchholz}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
