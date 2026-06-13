import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { registrationSchema, tournamentCodeSchema } from "@/lib/validation/schemas";
import { generateRegistrationId, currentYear } from "@/lib/utils/helpers";

const STORAGE_BUCKET = "proof_transfer";
const MAX_FILE_SIZE = 5_242_880;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("proof_transfer") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diunggah" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File harus berupa gambar (JPG, PNG)" },
        { status: 400 },
      );
    }

    const rawData = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      student_status: formData.get("student_status"),
      school_name: formData.get("school_name") || undefined,
      wa_number: formData.get("wa_number"),
      tournament_code: formData.get("tournament_code"),
      chess_rating: formData.get("chess_rating")
        ? Number(formData.get("chess_rating"))
        : undefined,
    };

    const parsed = registrationSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const supabase = await createServiceClient();

    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, status")
      .eq("code", data.tournament_code)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: "Kode turnamen tidak ditemukan" },
        { status: 404 },
      );
    }

    if (tournament.status !== "open") {
      return NextResponse.json(
        { error: "Pendaftaran turnamen ini sudah ditutup" },
        { status: 400 },
      );
    }

    const { data: existing, error: dupError } = await supabase
      .from("registrations")
      .select("id")
      .eq("tournament_id", tournament.id)
      .eq("email", data.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar untuk turnamen ini" },
        { status: 409 },
      );
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${data.tournament_code}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Gagal mengunggah bukti transfer" },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const proofUrl = publicUrlData.publicUrl;

    const year = currentYear();
    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .like("registration_id", `CATUR${year}-%`);

    const nextSeq = (count ?? 0) + 1;
    const registrationId = generateRegistrationId(year, nextSeq);

    const { error: insertError } = await supabase.from("registrations").insert({
      registration_id: registrationId,
      tournament_id: tournament.id,
      full_name: data.full_name,
      email: data.email,
      student_status: data.student_status,
      school_name: data.school_name ?? null,
      wa_number: data.wa_number,
      chess_rating: data.chess_rating ?? null,
      proof_transfer_url: proofUrl,
      paid: false,
      is_active: true,
    });

    if (insertError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Email sudah terdaftar untuk turnamen ini" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Gagal menyimpan data pendaftaran" },
        { status: 500 },
      );
    }

    return NextResponse.json({ registration_id: registrationId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 },
    );
  }
}
