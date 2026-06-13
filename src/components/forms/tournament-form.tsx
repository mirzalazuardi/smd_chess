"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TournamentData {
  code: string;
  name: string;
  description: string;
  rounds_count: number;
  status: string;
}

interface Props {
  initial?: Partial<TournamentData>;
  mode: "create" | "edit";
  tournamentId?: string;
}

export function TournamentForm({ initial, mode, tournamentId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body: Record<string, unknown> = {
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      rounds_count: Number(formData.get("rounds_count")),
    };

    if (mode === "edit") {
      body.status = formData.get("status");
    }

    try {
      const url =
        mode === "create"
          ? "/api/tournaments"
          : `/api/tournaments/${tournamentId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      router.push("/admin/turnamen");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Kode Turnamen
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          defaultValue={initial?.code ?? ""}
          pattern="^[a-z0-9_]+$"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="sumedang_open_2026"
        />
        <p className="mt-1 text-xs text-gray-400">
          Huruf kecil, angka, dan underscore. Contoh: sumedang_open_2026
        </p>
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nama Turnamen
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initial?.name ?? ""}
          maxLength={255}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Sumedang Open 2026"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deskripsi <span className="text-gray-400">(opsional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          maxLength={1000}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Informasi tambahan tentang turnamen..."
        />
      </div>

      <div>
        <label
          htmlFor="rounds_count"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Jumlah Ronde
        </label>
        <input
          id="rounds_count"
          name="rounds_count"
          type="number"
          required
          defaultValue={initial?.rounds_count ?? 5}
          min={1}
          max={20}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {mode === "edit" && (
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "draft"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="open">Pendaftaran Buka</option>
            <option value="ongoing">Sedang Berlangsung</option>
            <option value="finished">Selesai</option>
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting
            ? "Menyimpan..."
            : mode === "create"
              ? "Buat Turnamen"
              : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/turnamen")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
