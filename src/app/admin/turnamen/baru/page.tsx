import { TournamentForm } from "@/components/forms/tournament-form";

export default function CreateTournamentPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Buat Turnamen Baru
      </h1>
      <TournamentForm mode="create" />
    </div>
  );
}
