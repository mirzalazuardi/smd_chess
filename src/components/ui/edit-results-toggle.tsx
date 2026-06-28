"use client";

import { useState } from "react";
import { ResultInputForm } from "./result-input-form";

interface MatchRow {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
  white_name: string;
  black_name: string | null | undefined;
}

interface Props {
  roundId: string;
  matches: MatchRow[];
  initialResults: Record<string, { p1: number; p2: number | null }>;
}

export function EditResultsToggle({ roundId, matches, initialResults }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="mt-4 pt-4 border-t dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mengedit hasil
          </span>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            Batal
          </button>
        </div>
        <ResultInputForm
          roundId={roundId}
          matches={matches.map((m) => ({
            ...m,
            white_name: m.white_name,
            black_name: m.black_name ?? undefined,
          }))}
          initialResults={initialResults}
        />
      </div>
    );
  }

  const activeMatches = matches.filter((m) => m.player2_id);

  if (activeMatches.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Hasil tersimpan
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors"
        >
          Edit Hasil
        </button>
      </div>
      <div className="space-y-1.5">
        {activeMatches.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <span className="min-w-[120px] text-right truncate">
              {m.white_name ?? m.player1_id.slice(0, 8)}
            </span>
            <span className="font-mono min-w-[40px] text-center tabular-nums">
              {m.player1_score ?? "-"} - {m.player2_score ?? "-"}
            </span>
            <span className="min-w-[120px] truncate">
              {m.black_name ?? m.player2_id?.slice(0, 8) ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
