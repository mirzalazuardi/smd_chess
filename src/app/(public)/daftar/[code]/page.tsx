import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { RegistrationForm } from "@/components/forms/registration-form";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function DaftarByCodePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("code, name")
    .eq("code", code)
    .eq("status", "open")
    .single();

  if (!tournament) notFound();

  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Pendaftaran — {tournament.name}
          </h1>
        </div>
        <RegistrationForm tournaments={[tournament]} />
      </div>
    </main>
  );
}
