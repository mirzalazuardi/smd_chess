"use client";

import { useState } from "react";

interface PreviewData {
  tournamentName: string;
  federation?: string;
  rounds: number;
  playerCount: number;
  city?: string;
  startDate?: string;
}

interface ImportResult {
  imported: { players: number; rounds: number; matches: number };
  skipped: { players: Array<{ name: string; reason: string }> };
}

export default function SyncPage() {
  const [url, setUrl] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handlePreview() {
    setError(null);
    setPreview(null);
    setResult(null);

    if (!url) {
      setError("Masukkan URL chess-results.com");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/sync/preview/chess-results?url=${encodeURIComponent(url)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPreview(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal pratinjau");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setError(null);
    setResult(null);

    if (!url || !tournamentId) {
      setError("Lengkapi URL dan pilih turnamen");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sync/import/chess-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, tournamentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal impor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Sinkronisasi chess-results.com
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Import data turnamen dari chess-results.com ke SMD Chess. Masukkan URL
        turnamen (format: chess-results.com/tnr...).
      </p>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL chess-results.com
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://chess-results.com/tnr123456.aspx"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kode/ID Turnamen SMD
          </label>
          <input
            type="text"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="UUID turnamen target"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Pratinjau"}
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !preview}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Mengimpor..." : "Impor"}
          </button>
        </div>
      </div>

      {preview && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-8">
          <h2 className="font-semibold text-green-900 mb-2">Hasil Pratinjau</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-green-700">Turnamen</dt>
            <dd className="text-green-900 font-medium">{preview.tournamentName}</dd>
            {preview.federation && (
              <>
                <dt className="text-green-700">Federasi</dt>
                <dd className="text-green-900">{preview.federation}</dd>
              </>
            )}
            <dt className="text-green-700">Ronde</dt>
            <dd className="text-green-900">{preview.rounds}</dd>
            <dt className="text-green-700">Peserta</dt>
            <dd className="text-green-900">{preview.playerCount}</dd>
            {preview.city && (
              <>
                <dt className="text-green-700">Kota</dt>
                <dd className="text-green-900">{preview.city}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Hasil Impor</h2>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <dt className="text-blue-700">Peserta</dt>
              <dd className="text-blue-900 font-medium col-span-2">
                {result.imported.players}
              </dd>
              <dt className="text-blue-700">Ronde</dt>
              <dd className="text-blue-900 font-medium col-span-2">
                {result.imported.rounds}
              </dd>
              <dt className="text-blue-700">Pertandingan</dt>
              <dd className="text-blue-900 font-medium col-span-2">
                {result.imported.matches}
              </dd>
            </dl>
          </div>

          {result.skipped.players.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="font-medium text-yellow-900 mb-2">
                Dilewati ({result.skipped.players.length})
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {result.skipped.players.map((p, i) => (
                  <li key={i}>
                    <span className="font-medium">{p.name}</span> — {p.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
