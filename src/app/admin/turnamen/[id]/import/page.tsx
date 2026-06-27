import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db/server";
import { ImportPesertaForm } from "@/components/forms/import-peserta-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ImportPesertaPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, status")
    .eq("id", id)
    .single();

  if (!tournament) {
    notFound();
  }

  const canImport = tournament.status === "draft" || tournament.status === "open";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/turnamen/${tournament.id}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Import Peserta (CSV)
        </h1>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        Turnamen: <span className="font-medium">{tournament.name}</span>
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Status:{" "}
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
          {tournament.status}
        </span>
      </p>

      {!canImport ? (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          Impor peserta hanya tersedia untuk turnamen dengan status <strong>draft</strong> atau{" "}
          <strong>open</strong>. Status turnamen saat ini adalah{" "}
          <strong>{tournament.status}</strong>.
        </div>
      ) : (
        <>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              Unggah file <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">.csv</code>{" "}
              dengan format:
            </p>
            <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs overflow-x-auto">
              nama,sekolah,lunas,wa,email
            </pre>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <li>
                <strong>nama</strong> — wajib diisi (1–100 karakter)
              </li>
              <li>
                <strong>sekolah</strong> — opsional; bila diisi, status otomatis <em>pelajar</em>
              </li>
              <li>
                <strong>lunas</strong> — opsional; <code>ya</code> untuk lunas, kosong untuk belum lunas
              </li>
              <li>
                <strong>wa</strong> — opsional; hanya angka, 10–15 digit
              </li>
              <li>
                <strong>email</strong> — opsional; format email valid
              </li>
            </ul>
            <Link
              href="/template-import-peserta.csv"
              className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-xs"
            >
              Unduh template CSV
            </Link>
          </div>

          <ImportPesertaForm tournamentId={tournament.id} />
        </>
      )}
    </div>
  );
}
