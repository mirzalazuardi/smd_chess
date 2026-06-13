"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AutoRefresh } from "@/components/ui/auto-refresh";

interface MatchData {
  id: string;
  table_no: number | null;
  player1_id: string;
  player2_id: string | null;
  player1_name: string;
  player2_name: string | null;
  player1_score: number | null;
  player2_score: number | null;
}

interface RoundNav {
  prev: number | null;
  current: number;
  next: number | null;
}

interface Props {
  tournamentName: string;
  tournamentCode: string;
  roundNav: RoundNav;
  matches: MatchData[];
}

function columnize<T>(items: T[], cols: number): T[][] {
  const perCol = Math.ceil(items.length / cols);
  const result: T[][] = [];
  for (let i = 0; i < cols; i++) {
    result.push(items.slice(i * perCol, (i + 1) * perCol));
  }
  return result;
}

export function TvPairingView({
  tournamentName,
  tournamentCode,
  roundNav,
  matches,
}: Props) {
  const router = useRouter();
  const columns = columnize(matches, 3);

  function navigate(round: number) {
    router.push(`/pairing/${tournamentCode}/${round}`);
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0">
        <ThemeToggle />
        <h1 className="text-xl font-bold text-center flex-1">
          {tournamentName} — Ronde {roundNav.current}
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 overflow-hidden">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="overflow-hidden p-4">
            {col.map((match) => (
              <div
                key={match.id}
                className="py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg tabular-nums min-w-[2rem] text-right">
                    {match.table_no ?? "-"}
                  </span>
                  <span className="font-medium flex-1 truncate">
                    {match.player1_name}
                  </span>
                </div>
                {match.player2_id ? (
                  <div className="flex items-baseline gap-2 pl-[2.5rem]">
                    <span className="text-sm text-gray-400 dark:text-gray-500 min-w-[1.5rem] text-center">
                      vs
                    </span>
                    <span className="flex-1 truncate">
                      {match.player2_name}
                    </span>
                  </div>
                ) : (
                  <div className="pl-[2.5rem]">
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      BYE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </main>

      <footer className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0">
        <div className="flex gap-2">
          {roundNav.prev !== null ? (
            <button
              onClick={() => navigate(roundNav.prev!)}
              className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              &larr; Ronde {roundNav.prev}
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ronde {roundNav.current}
          </span>
          <AutoRefresh intervalSeconds={30} />
        </div>

        <div className="flex gap-2 justify-end">
          {roundNav.next !== null ? (
            <button
              onClick={() => navigate(roundNav.next!)}
              className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Ronde {roundNav.next} &rarr;
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </footer>
    </div>
  );
}
