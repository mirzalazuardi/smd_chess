export default function OfflinePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl" role="img" aria-label="Ikon catur">
          ♟
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Anda sedang offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Halaman ini tidak tersedia dalam mode offline. Silakan cek koneksi
          internet Anda dan coba lagi.
        </p>
      </div>
    </main>
  );
}
