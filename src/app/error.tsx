"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Terjadi Kesalahan
        </h1>
        <p className="text-sm text-gray-500">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
