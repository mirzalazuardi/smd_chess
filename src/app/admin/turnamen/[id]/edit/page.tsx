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
      <TournamentForm
        mode="edit"
        tournamentId={tournament.id}
        initial={tournament}
      />
    </div>
  );
}
