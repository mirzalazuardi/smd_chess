"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Match {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
}

interface Props {
  roundId: string;
  matches: (Match & { white_name?: string; black_name?: string })[];
}

export function ResultInputForm({ roundId, matches }: Props) {
  const router = useRouter();
  const [results, setResults] = useState<Record<string, { p1: number; p2: number | null }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setResult(matchId: string, value: "1-0" | "0-1" | "0.5-0.5" | "") {
    if (!value) {
      const copy = { ...results };
      delete copy[matchId];
      setResults(copy);
      return;
    }
    const p1 = value === "1-0" ? 1 : value === "0-1" ? 0 : 0.5;
    const p2 = value === "1-0" ? 0 : value === "0-1" ? 1 : 0.5;
    setResults({ ...results, [matchId]: { p1, p2 } });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body = matches
        .filter((m) => m.player2_id)
        .map((m) => ({
          match_id: m.id,
          player1_score: results[m.id]?.p1 ?? m.player1_score ?? 0,
          player2_score: results[m.id]?.p2 ?? m.player2_score ?? 0,
        }));

      const res = await fetch(`/api/rounds/${roundId}/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: body }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Gagal menyimpan");
      } else {
        router.refresh();
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  const activeMatches = matches.filter((m) => m.player2_id);

  if (activeMatches.length === 0) {
    return <p className="text-sm text-gray-500">Tidak ada pertandingan (bye).</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {activeMatches.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800"
          >
            <span className="text-sm font-medium min-w-[120px]">
              {m.white_name ?? m.player1_id.slice(0, 8)}
            </span>
            <select
              value={
                results[m.id]
                  ? results[m.id].p1 === 1
                    ? "1-0"
                    : results[m.id].p1 === 0.5
                      ? "0.5-0.5"
                      : "0-1"
                  : ""
              }
              onChange={(e) =>
                setResult(
                  m.id,
                  e.target.value as "1-0" | "0-1" | "0.5-0.5" | "",
                )
              }
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">-- Hasil --</option>
              <option value="1-0">1 - 0</option>
              <option value="0.5-0.5">&frac12; - &frac12;</option>
              <option value="0-1">0 - 1</option>
            </select>
            <span className="text-sm font-medium min-w-[120px]">
              {m.black_name ?? (m.player2_id ?? "").slice(0, 8)}
            </span>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || Object.keys(results).length === 0}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Menyimpan..." : "Simpan Hasil"}
      </button>
    </div>
  );
}
