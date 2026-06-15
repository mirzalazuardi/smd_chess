import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { createServiceClient } from "@/lib/db/server";
import { VerifyButton } from "@/components/ui/verify-button";
import { ProofViewer } from "@/components/ui/proof-viewer";
import { PaymentFilter } from "./payment-filter";

interface Props {
  params: Promise<{ tournament_id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function PaymentDetailPage({
  params,
  searchParams,
}: Props) {
  const { tournament_id } = await params;
  const { status } = await searchParams;

  const supabase = await createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("code, name")
    .eq("id", tournament_id)
    .single();

  if (!tournament) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        Turnamen tidak ditemukan.
      </div>
    );
  }

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  let query = supabase
    .from("registrations")
    .select("*")
    .eq("tournament_id", tournament_id)
    .order("created_at", { ascending: false });

  if (status === "paid") {
    query = query.eq("paid", true);
  } else if (status === "unpaid") {
    query = query.eq("paid", false);
  }

  const { data: registrations } = await query;

  const totalPaid =
    registrations?.filter((r) => r.paid).length ?? 0;
  const totalUnpaid =
    registrations?.filter((r) => !r.paid).length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/admin/pembayaran"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Kembali
        </Link>
        <span className="text-gray-300">|</span>
        <p className="text-sm text-gray-500 font-mono">{tournament.code}</p>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {tournament.name}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {registrations?.length ?? 0} pendaftar ({totalPaid} lunas, {totalUnpaid}{" "}
        belum)
      </p>

      <PaymentFilter current={status} />

      {!registrations || registrations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada pendaftar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Nama
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Rating
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Bukti
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Pembayaran
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-xs">{r.registration_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize">
                      {r.student_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.chess_rating ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ProofViewer
                      url={r.proof_transfer_url}
                      name={r.full_name}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <VerifyButton
                      registrationId={r.id}
                      initialPaid={r.paid}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
