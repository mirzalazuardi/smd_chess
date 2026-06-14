import { createClient } from "@/lib/db/server";
import { RegistrationForm } from "@/components/forms/registration-form";

export default async function DaftarPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("code, name")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const openTournaments = tournaments ?? [];

  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pendaftaran Turnamen
          </h1>
          <p className="text-sm text-gray-500">
            Isi formulir di bawah untuk mendaftar turnamen catur
          </p>
        </div>

        {openTournaments.length === 0 ? (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800 text-center">
            Belum ada turnamen yang dibuka pendaftarannya.
          </div>
        ) : (
          <RegistrationForm tournaments={openTournaments} />
        )}
      </div>
    </main>
  );
}
