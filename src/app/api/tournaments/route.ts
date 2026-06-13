import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/server";
import { tournamentCodeSchema } from "@/lib/validation/schemas";

const createSchema = z.object({
  code: tournamentCodeSchema,
  name: z.string().min(1, "Nama turnamen wajib diisi").max(255),
  description: z.string().max(1000).optional(),
  rounds_count: z
    .number()
    .int("Jumlah ronde harus bilangan bulat")
    .min(1, "Minimal 1 ronde")
    .max(20, "Maksimal 20 ronde"),
  status: z.enum(["draft", "open"]).optional(),
});

const updateSchema = createSchema.partial();

export async function GET() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data turnamen" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        ...parsed.data,
        status: parsed.data.status ?? "draft",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Kode turnamen sudah digunakan" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Gagal membuat turnamen" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400 },
    );
  }
}
