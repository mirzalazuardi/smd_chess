import Link from "next/link";
import { createServiceClient } from "@/lib/db/server";

export default async function AdminDashboard() {
  const supabase = await createServiceClient();

  const { count: totalTournaments } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true });

  const { count: activeTournaments } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "ongoing"]);

  const { count: totalRegistrations } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true });

  const { count: pendingPayments } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("paid", false);

  const { count: totalRounds } = await supabase
    .from("tournament_rounds")
    .select("*", { count: "exact", head: true });

  const { data: recentTournaments } = await supabase
    .from("tournaments")
    .select("code, name, status, rounds_count, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "Total Turnamen",
      value: totalTournaments ?? 0,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      href: "/admin/turnamen",
    },
    {
      label: "Turnamen Aktif",
      value: activeTournaments ?? 0,
      color: "bg-green-50 text-green-700 border-green-200",
      href: "/admin/ronde",
    },
    {
      label: "Total Pendaftar",
      value: totalRegistrations ?? 0,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      href: "/admin/pembayaran",
    },
    {
      label: "Belum Lunas",
      value: pendingPayments ?? 0,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      href: "/admin/pembayaran",
    },
    {
      label: "Total Ronde",
      value: totalRounds ?? 0,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      href: "/admin/ronde",
    },
  ];

  const quickActions = [
    {
      label: "Buat Turnamen",
      desc: "Tambah turnamen baru",
      href: "/admin/turnamen/baru",
      icon: "+",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Verifikasi Bayar",
      desc: "Cek bukti transfer",
      href: "/admin/pembayaran",
      icon: "✓",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "Kelola Ronde",
      desc: "Generate pairing & input hasil",
      href: "/admin/ronde",
      icon: "♟",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: "Lihat Jadwal",
      desc: "Buka halaman publik",
      href: "/jadwal",
      icon: "→",
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    open: "Buka",
    ongoing: "Berlangsung",
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan dan akses cepat ke semua fitur
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-lg border p-4 ${s.color} hover:shadow-md transition-all`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`rounded-lg p-4 text-white transition-all ${a.color}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold leading-none">{a.icon}</span>
              <span className="text-sm font-medium">{a.label}</span>
            </div>
            <p className="text-xs opacity-80">{a.desc}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Turnamen Terbaru
          </h2>
          <Link
            href="/admin/turnamen"
            className="text-sm text-blue-600 hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {!recentTournaments || recentTournaments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg text-sm text-gray-500">
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
                    Dibuat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTournaments.map((t) => (
                  <tr key={t.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.code}</td>
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3">{t.rounds_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] || ""}`}
                      >
                        {statusLabel[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
