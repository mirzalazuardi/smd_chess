import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";
import { tournamentCodeSchema } from "@/lib/validation/schemas";

const updateSchema = z.object({
  code: tournamentCodeSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  rounds_count: z.number().int().min(1).max(20).optional(),
  status: z.enum(["draft", "open", "ongoing", "finished"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Turnamen tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("tournaments")
      .update(parsed.data)
      .eq("id", id)
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
        { error: "Gagal mengubah turnamen" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Gagal menghapus turnamen" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
