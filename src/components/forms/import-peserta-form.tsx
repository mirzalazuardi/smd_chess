"use client";

import { useState, useRef } from "react";

interface SkippedRow {
  lineNumber: number;
  full_name: string;
  reason: string;
}

interface ImportResult {
  imported: number;
  skipped: SkippedRow[];
}

interface Props {
  tournamentId: string;
}

export function ImportPesertaForm({ tournamentId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file CSV terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    setSubmitting(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/import`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal mengimpor");
        return;
      }

      setResult(json);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
            File CSV
          </label>
          <input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv"
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Mengimpor..." : "Impor"}
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            <span className="font-semibold">{result.imported}</span> peserta berhasil diimpor
            {result.skipped.length > 0 && (
              <>, <span className="font-semibold">{result.skipped.length}</span> dilewati</>
            )}
          </div>

          {result.skipped.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Baris</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Nama</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.skipped.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{row.lineNumber}</td>
                      <td className="px-3 py-2">{row.full_name}</td>
                      <td className="px-3 py-2 text-gray-500">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
