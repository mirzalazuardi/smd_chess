import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-lg font-semibold text-gray-700">
          Halaman Admin Tidak Ditemukan
        </h2>
        <Link
          href="/admin"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
