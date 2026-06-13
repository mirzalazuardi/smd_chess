# Spec: Fix Root Path & Multi-Tournament Registration

## TournamentIndex Component

### File: `src/components/ui/tournament-index.tsx`

Server component. Reusable untuk semua halaman indeks turnamen.

```typescript
interface Props {
  title: string;           // "Jadwal Pertandingan" | "Klasemen"
  description: string;     // subtitle singkat
  linkPrefix: string;      // "/jadwal" | "/klasemen"
  statusFilter: string[];  // ["ongoing","open"] | ["ongoing","finished"]
  emptyMessage: string;    // ditampilkan saat tidak ada turnamen
}
```

**Implementation:**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/db/server";

export async function TournamentIndex({
  title, description, linkPrefix, statusFilter, emptyMessage,
}: Props) {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("code, name, status, rounds_count")
    .in("status", statusFilter)
    .order("created_at", { ascending: false });

  const items = tournaments ?? [];

  if (items.length === 0) {
    return (
      <main className="flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">{emptyMessage}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link
            key={t.code}
            href={`${linkPrefix}/${t.code}`}
            className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h2 className="font-semibold text-gray-900">{t.name}</h2>
            <p className="text-xs text-gray-400 font-mono mt-1">{t.code}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={t.status} />
              <span className="text-xs text-gray-400">
                {t.rounds_count} ronde
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

**Status badge:** Gunakan style yang sama dengan admin page:
- `draft` → gray
- `open` → green
- `ongoing` → blue
- `finished` → gray

---

## Jadwal Index Page

### File: `src/app/(public)/jadwal/page.tsx`

```tsx
import { TournamentIndex } from "@/components/ui/tournament-index";

export default function JadwalIndexPage() {
  return (
    <TournamentIndex
      title="Jadwal Pertandingan"
      description="Pilih turnamen untuk melihat jadwal pairing"
      linkPrefix="/jadwal"
      statusFilter={["ongoing", "open", "finished"]}
      emptyMessage="Belum ada turnamen dengan jadwal pertandingan."
    />
  );
}
```

---

## Klasemen Index Page

### File: `src/app/(public)/klasemen/page.tsx`

```tsx
import { TournamentIndex } from "@/components/ui/tournament-index";

export default function KlasemenIndexPage() {
  return (
    <TournamentIndex
      title="Klasemen"
      description="Pilih turnamen untuk melihat klasemen"
      linkPrefix="/klasemen"
      statusFilter={["ongoing", "finished"]}
      emptyMessage="Belum ada turnamen dengan klasemen."
    />
  );
}
```

---

## Direct Registration Route

### File: `src/app/(public)/daftar/[code]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { RegistrationForm } from "@/components/forms/registration-form";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function DaftarByCodePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("code, name")
    .eq("code", code)
    .eq("status", "open")
    .single();

  if (!tournament) notFound();

  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Pendaftaran — {tournament.name}
          </h1>
        </div>
        <RegistrationForm tournaments={[tournament]} />
      </div>
    </main>
  );
}
```

**Note:** `RegistrationForm` sudah handle single tournament — lihat line 79:
```tsx
const code = tournaments.length === 1 ? tournaments[0].code : undefined;
```
Jika `tournaments.length === 1`, form pakai hidden input tanpa dropdown.

---

## Existing Links — No Changes Needed

Link existing di file berikut otomatis resolve ke halaman indeks baru:

| File | Link | Resolves to |
|------|------|-------------|
| `src/app/page.tsx` | `/jadwal` | New index page |
| `src/app/page.tsx` | `/klasemen` | New index page |
| `src/app/admin/page.tsx` | `/jadwal` | New index page |
| `src/app/(public)/daftar/sukses/page.tsx` | `/jadwal` | New index page |

Karena Next.js App Router match route `/jadwal` → `page.tsx` jika tidak ada `[code]`.

---

## Testing

### Unit Tests (new file: `tests/routing/root-path.test.tsx`)

```typescript
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

describe("/daftar/[code]", () => {
  it("returns 404 for invalid tournament code", async () => {
    // Mock supabase to return null
    // Render DaftarByCodePage with invalid code
    // Expect notFound to be called
  });

  it("returns 404 for non-open tournament", async () => {
    // Mock supabase to return tournament with status != 'open'
    // Render DaftarByCodePage
    // Expect notFound to be called
  });
});
```

### Manual Tests

1. Buka `/` → klik "Lihat Jadwal" → muncul daftar turnamen → klik salah satu → `/jadwal/[code]`
2. Buka `/` → klik "Klasemen" → muncul daftar turnamen → klik → `/klasemen/[code]`
3. Buka `/admin` → klik "Lihat Jadwal" → muncul daftar turnamen
4. Buka `/daftar/[valid-code]` → form dengan turnamen pre-selected, tanpa dropdown
5. Buka `/daftar/[invalid-code]` → 404
6. Buka `/daftar` → tetap berfungsi dengan dropdown (jika >1 turnamen open)
