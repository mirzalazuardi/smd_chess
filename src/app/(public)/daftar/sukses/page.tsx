import Link from "next/link";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function SuksesPage({ searchParams }: Props) {
  const params = await searchParams;
  const registrationId = params.id ?? "Tidak diketahui";

  return (
    <main className="flex-1 px-4 py-16">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pendaftaran Berhasil!
        </h1>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-blue-600 mb-1">ID Pendaftaran Anda</p>
          <p className="text-2xl font-mono font-bold text-blue-800">
            {registrationId}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Simpan ID ini untuk mengecek status pendaftaran Anda. Tim kami akan
          memverifikasi pembayaran Anda dalam 1x24 jam.
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors no-underline"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/jadwal"
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors no-underline"
          >
            Lihat Jadwal
          </Link>
        </div>
      </div>
    </main>
  );
}
