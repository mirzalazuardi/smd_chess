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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">{emptyMessage}</p>
      </main>
    );
  }

  return <main>TODO: tournament grid</main>;
}
