"use client";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  current?: string;
}

export function PaymentFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function setFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeClass = "bg-blue-600 text-white";
  const inactiveClass = "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700";

  return (
    <div className="flex gap-2 mb-6">
      {[
        { label: "Semua", value: "" },
        { label: "Belum Lunas", value: "unpaid" },
        { label: "Lunas", value: "paid" },
      ].map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setFilter(value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${(!current && !value) || current === value ? activeClass : inactiveClass}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
