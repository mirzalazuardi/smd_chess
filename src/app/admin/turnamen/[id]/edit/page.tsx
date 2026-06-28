import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db/server";
import { TournamentForm } from "@/components/forms/tournament-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTournamentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (!tournament) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Turnamen
      </h1>
      <div className="mb-6">
        <Link
          href={`/admin/turnamen/${tournament.id}/import`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Import Peserta (CSV) &rarr;
        </Link>
        <span className="mx-2 text-gray-300">|</span>
        <Link
          href={`/api/tournaments/${tournament.id}/export/csv`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Export CSV &rarr;
        </Link>
        <span className="mx-2 text-gray-300">|</span>
        <Link
          href={`/api/tournaments/${tournament.id}/export/trf`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Export TRF &rarr;
        </Link>
      </div>
      <TournamentForm
        mode="edit"
        tournamentId={tournament.id}
        initial={tournament}
      />
    </div>
  );
}
