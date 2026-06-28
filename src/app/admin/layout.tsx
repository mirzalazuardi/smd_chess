import Link from "next/link";
import Image from "next/image";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieToSet } from "@/lib/db/types";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("Cookie set error:", err);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const pathname = (await headers()).get("x-pathname") || "";

  if (!user && !pathname.endsWith("/admin/login")) {
    redirect("/admin/login");
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <Image
                src="/logo-percasi.jpg"
                alt="PERCASI"
                width={32}
                height={32}
                className="rounded"
              />
              SMD Admin
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/admin/turnamen"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Turnamen
              </Link>
              <Link
                href="/admin/pembayaran"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pembayaran
              </Link>
              <Link
                href="/admin/ronde"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Ronde
              </Link>
              <Link
                href="/admin/sync"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sync
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
