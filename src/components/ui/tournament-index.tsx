import Link from "next/link";
import { createClient } from "@/lib/db/server";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Buka",
  ongoing: "Berlangsung",
  finished: "Selesai",
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-green-100 text-green-700",
  ongoing: "bg-blue-100 text-blue-700",
  finished: "bg-yellow-100 text-yellow-700",
};

interface Props {
  title: string;
  description: string;
  linkPrefix: string;
  statusFilter: string[];
  emptyMessage: string;
}

export async function TournamentIndex({
  title,
  description,
  linkPrefix,
  statusFilter,
  emptyMessage,
}: Props) {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("code, name, status, rounds_count")
    .in("status", statusFilter)
    .order("created_at", { ascending: false });

  const items = tournaments ?? [];

  if (items.length === 0) {
    return (
      <main className="flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-500">{emptyMessage}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link
            key={t.code}
            href={`${linkPrefix}/${t.code}`}
            className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white">{t.name}</h2>
            <p className="text-xs text-gray-400 font-mono mt-1">{t.code}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[t.status]}`}>
                {statusLabels[t.status]}
              </span>
              <span className="text-xs text-gray-400">
                {t.rounds_count} ronde
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
