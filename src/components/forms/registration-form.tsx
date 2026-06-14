"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Tournament {
  code: string;
  name: string;
}

interface Props {
  tournaments: Tournament[];
}

export function RegistrationForm({ tournaments }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studentStatus, setStudentStatus] = useState<"pelajar" | "umum">("umum");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);

    if (studentStatus === "umum") {
      formData.delete("school_name");
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      router.push(`/daftar/sukses?id=${json.registration_id}`);
    } catch {
      setError("Gagal terhubung ke server");
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 400 * 1024) {
        setError("Ukuran file maksimal 400KB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar (JPG, PNG)");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFileName(file.name);
      setError(null);
    }
  }

  const code = tournaments.length === 1 ? tournaments[0].code : undefined;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="tournament_code" className="block text-sm font-medium text-gray-700 mb-1">
          Turnamen
        </label>
        {code ? (
          <input type="hidden" name="tournament_code" value={code} />
        ) : (
          <select
            id="tournament_code"
            name="tournament_code"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Pilih turnamen</option>
            {tournaments.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        {code && (
          <p className="mt-1 text-sm text-gray-500">
            {tournaments[0].name}
          </p>
        )}
      </div>


      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Contoh: Budi Santoso"
        />
      </div>


      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(opsional)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="contoh@email.com"
        />
      </div>


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="student_status"
              value="pelajar"
              checked={studentStatus === "pelajar"}
              onChange={() => setStudentStatus("pelajar")}
              className="text-blue-600"
            />
            <span className="text-sm">Pelajar</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="student_status"
              value="umum"
              checked={studentStatus === "umum"}
              onChange={() => setStudentStatus("umum")}
              className="text-blue-600"
            />
            <span className="text-sm">Umum</span>
          </label>
        </div>
      </div>


      {studentStatus === "pelajar" && (
        <div>
          <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nama Sekolah
          </label>
          <input
            id="school_name"
            name="school_name"
            type="text"
            required
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Contoh: SMA Negeri 1 Sumedang"
          />
        </div>
      )}


      <div>
        <label htmlFor="wa_number" className="block text-sm font-medium text-gray-700 mb-1">
          Nomor WhatsApp
        </label>
        <input
          id="wa_number"
          name="wa_number"
          type="tel"
          required
          minLength={10}
          maxLength={15}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="081234567890"
        />
      </div>


      <div>
        <label htmlFor="chess_rating" className="block text-sm font-medium text-gray-700 mb-1">
          Rating Catur <span className="text-gray-400">(opsional)</span>
        </label>
        <input
          id="chess_rating"
          name="chess_rating"
          type="number"
          min={0}
          max={3000}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Contoh: 1500"
        />
      </div>


      <div>
        <label htmlFor="proof_transfer" className="block text-sm font-medium text-gray-700 mb-1">
          Bukti Transfer
        </label>
        <input
          ref={fileInputRef}
          id="proof_transfer"
          name="proof_transfer"
          type="file"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full text-sm bg-white text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {fileName && (
          <p className="mt-1 text-xs text-green-600">{fileName}</p>
        )}
      </div>


      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Mengirim..." : "Daftar"}
      </button>
    </form>
  );
}
