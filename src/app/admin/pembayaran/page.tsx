import Link from "next/link";
import { createServiceClient } from "@/lib/db/server";

export default async function PaymentListPage() {
  const supabase = await createServiceClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, code, name, status")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Verifikasi Pembayaran
      </h1>

      {!tournaments || tournaments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada turnamen.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/admin/pembayaran/${t.id}`}
              className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <p className="font-mono text-xs text-gray-500 mb-1">{t.code}</p>
              <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
              <p className="text-xs text-gray-500 mt-2 capitalize">
                {t.status === "open"
                  ? "Pendaftaran Buka"
                  : t.status === "ongoing"
                    ? "Sedang Berlangsung"
                    : t.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
