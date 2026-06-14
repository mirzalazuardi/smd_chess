import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo-percasi.jpg"
            alt="Logo PERCASI"
            width={48}
            height={48}
            className="rounded"
          />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              PERCASI Sumedang
            </p>
            <p className="text-xs text-gray-500">Sistem Manajemen Turnamen Catur</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
