import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Harus login sebagai admin" },
        { status: 401 },
      ),
    };
  }

  return { user, errorResponse: null };
}
