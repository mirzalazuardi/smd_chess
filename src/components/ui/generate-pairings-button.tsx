"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  tournamentId: string;
}

export function GeneratePairingsButton({ tournamentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/rounds`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Gagal generate pairing");
      } else {
        router.refresh();
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Menggenerate..." : "Generate Pairing"}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
