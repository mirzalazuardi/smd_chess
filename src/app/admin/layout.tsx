import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };
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
          } catch {}
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

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
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
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:inline">
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
