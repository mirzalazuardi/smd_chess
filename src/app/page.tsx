import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          SMD Chess
        </h1>
        <p className="text-lg text-gray-600">
          Sistem manajemen turnamen catur Percasi Sumedang — registrasi online,
          verifikasi pembayaran, dan Swiss pairing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/daftar"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Daftar Turnamen
          </Link>
          <Link
            href="/jadwal"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Lihat Jadwal
          </Link>
          <Link
            href="/klasemen"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Klasemen
          </Link>
        </div>
        <p className="text-sm text-gray-400 pt-8">
          Admin?{" "}
          <Link
            href="/admin/login"
            className="text-blue-600 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
