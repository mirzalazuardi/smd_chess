import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-gray-500">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
