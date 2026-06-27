import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { parseCsv } from "@/lib/import/csv";
import { parseImport, validateImportRows, dedupeByName } from "@/lib/import/parse-import";
import type { InvalidRow } from "@/lib/import/parse-import";
import { generateRegistrationId, currentYear } from "@/lib/utils/helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, code, name, status")
    .eq("id", id)
    .single();

  if (tournamentError || !tournament) {
    return NextResponse.json(
      { error: "Turnamen tidak ditemukan" },
      { status: 404 },
    );
  }

  if (tournament.status !== "draft" && tournament.status !== "open") {
    return NextResponse.json(
      { error: "Impor hanya tersedia untuk turnamen dengan status draft atau open" },
      { status: 409 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request harus berupa multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "File CSV wajib diunggah" },
      { status: 400 },
    );
  }

  const text = await file.text();
  const records = parseCsv(text);

  const { headerError, rows } = parseImport(records);
  if (headerError) {
    return NextResponse.json({ error: headerError }, { status: 400 });
  }

  const { valid, invalid } = validateImportRows(rows);

  const { data: existingRegs } = await supabase
    .from("registrations")
    .select("full_name")
    .eq("tournament_id", tournament.id);

  const existingNames = (existingRegs ?? []).map((r) => r.full_name);
  const { unique, duplicates } = dedupeByName(valid, existingNames);

  let skipped: InvalidRow[] = [...invalid, ...duplicates];

  const year = currentYear();
  const { count: existingCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .like("registration_id", `CATUR${year}-%`);

  let nextSeq = (existingCount ?? 0) + 1;
  let imported = 0;

  for (const row of unique) {
    const registrationId = generateRegistrationId(year, nextSeq++);

    const { error: insertError } = await supabase
      .from("registrations")
      .insert({
        registration_id: registrationId,
        tournament_id: tournament.id,
        full_name: row.full_name,
        student_status: row.student_status,
        school_name: row.school_name ?? null,
        wa_number: row.wa_number ?? null,
        email: row.email ?? null,
        paid: row.paid,
        proof_transfer_url: null,
        is_active: true,
      });

    if (insertError) {
      skipped.push({
        lineNumber: row.lineNumber,
        full_name: row.full_name,
        reason: insertError.code === "23505"
          ? "ID pendaftaran duplikat"
          : `Gagal menyimpan: ${insertError.message}`,
      });
      continue;
    }

    imported++;
  }

  skipped = skipped.sort((a, b) => a.lineNumber - b.lineNumber);

  return NextResponse.json({ imported, skipped });
}
