import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const paid = body.paid === true;
    const adminId = body.admin_id as string | undefined;

    if (!adminId) {
      return NextResponse.json(
        { error: "ID admin diperlukan" },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("registrations")
      .update({
        paid,
        payment_verified_at: paid ? new Date().toISOString() : null,
        payment_verified_by: paid ? adminId : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Gagal mengubah status pembayaran" },
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
