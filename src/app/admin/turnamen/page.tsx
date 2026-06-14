import Link from "next/link";
import { createServiceClient } from "@/lib/db/server";

export default async function TournamentListPage() {
  const supabase = await createServiceClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    open: "Pendaftaran Buka",
    ongoing: "Sedang Berlangsung",
    finished: "Selesai",
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    open: "bg-green-100 text-green-700",
    ongoing: "bg-blue-100 text-blue-700",
    finished: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Turnamen</h1>
        <Link
          href="/admin/turnamen/baru"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Buat Turnamen
        </Link>
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada turnamen. Klik &ldquo;Buat Turnamen&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Kode
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Nama
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Ronde
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{t.code}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">{t.rounds_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] || ""}`}
                    >
                      {statusLabel[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link
                      href={`/admin/turnamen/${t.id}/edit`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
