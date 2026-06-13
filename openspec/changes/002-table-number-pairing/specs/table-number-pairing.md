# Spec: Table Number for Match Pairings

## Overview

Menambahkan nomor meja (`table_no`) pada setiap match untuk memudahkan wasit dan peserta menemukan meja pertandingan. Nomor meja kecil = pemain skor tinggi.

## Database Schema

### Migration: Add table_no column

```sql
-- Add table_no column to matches
ALTER TABLE matches ADD COLUMN table_no INT;

-- Constraint: table_no must be positive when not null
ALTER TABLE matches ADD CONSTRAINT positive_table_no
  CHECK (table_no IS NULL OR table_no > 0);

-- Index for ordering
CREATE INDEX idx_matches_table_no ON matches(round_id, table_no);
```

**Notes:**
- `table_no` nullable — bye matches use NULL
- Table 1 = highest scoring pair in the round
- Index untuk query performance saat order by table_no

## Type Changes

### src/lib/swiss/types.ts

```typescript
export interface Pairing {
  white: Player;
  black: Player | null;
  tableNo: number | null;  // NEW: null for bye
}
```

## Pairing Logic

### src/lib/swiss/pairing.ts

Setelah generate pairings, assign table numbers:

```typescript
export function generateSwissPairings(players: Player[]): Pairing[] {
  // ... existing logic ...

  // Assign table numbers
  let tableNo = 1;
  for (const pair of pairings) {
    if (pair.black !== null) {
      pair.tableNo = tableNo++;
    } else {
      pair.tableNo = null; // Bye - no table
    }
  }

  return pairings;
}
```

**Rules:**
1. Regular matches get sequential table numbers starting from 1
2. Bye matches get `tableNo = null`
3. Order is preserved from pairing generation (highest score first)

## API Changes

### POST /api/rounds/[id]/generate

Saat menyimpan matches ke database, include `table_no`:

```typescript
const matchInserts = pairings.map((pair) => ({
  round_id: roundId,
  player1_id: pair.white.id,
  player2_id: pair.black?.id ?? null,
  table_no: pair.tableNo,  // NEW
  status: pair.black ? "ongoing" : "completed",
  player1_score: pair.black ? null : 1,
  player2_score: pair.black ? null : null,
}));
```

## Admin UI

### /admin/ronde/[tournament_id]

Tambah kolom "Meja" di tabel matches:

```
┌──────┬─────────────────┬─────┬─────────────────┐
│ Meja │ Putih           │     │ Hitam           │
├──────┼─────────────────┼─────┼─────────────────┤
│  1   │ Andi            │ vs  │ Budi            │
│  2   │ Citra           │ vs  │ Dina            │
│  -   │ Eko             │ BYE │                 │
└──────┴─────────────────┴─────┴─────────────────┘
```

**Query:**
```sql
SELECT * FROM matches
WHERE round_id = ?
ORDER BY table_no ASC NULLS LAST
```

## Public TV Display

### NEW: /pairing/[code]/[round]

Route: `src/app/(public)/pairing/[code]/[round]/page.tsx`

**Layout: 3 kolom x 17 baris = max 51 meja**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☀️]                   SUMEDANG OPEN 2026 — RONDE 1                      │
├────────────────────────┬────────────────────────┬───────────────────────┤
│  1. Andi vs Budi       │ 18. Rudi vs Sinta      │ 35. Ali vs Beni       │
│  2. Citra vs Dina      │ 19. Sari vs Tari       │ 36. Cici vs Dodi      │
│  3. Eko vs Fani        │ 20. Toni vs Umi        │ 37. Edi vs Fifi       │
│  ...                   │ ...                    │ ...                   │
│ 17. Pita vs Qori       │ 34. Zaki vs Aa         │ 50. Yeye (BYE)        │
├─────────────────────────────────────────────────────────────────────────┤
│              ◀ Ronde 1 / 7 ▶              [ Auto-refresh: 30s ]         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Full viewport height (`100vh`), no scroll
- Font: 18-20px, bold untuk nomor meja
- 3 columns layout untuk max 51 meja
- Auto-refresh setiap 30 detik
- Navigasi ronde di footer (prev/next)

## Theme Toggle

### Component: src/components/ui/theme-toggle.tsx

Toggle button di pojok kiri atas header.

**Day Mode (default):**
- Background: `#FFFFFF` (white)
- Text: `#1F2937` (gray-800)
- Border: `#E5E7EB` (gray-200)
- Header bg: `#F3F4F6` (gray-100)

**Night Mode:**
- Background: `#111827` (gray-900)
- Text: `#F9FAFB` (gray-50)
- Border: `#374151` (gray-700)
- Header bg: `#1F2937` (gray-800)

**Implementation:**
- Toggle icon: ☀️ (day) / 🌙 (night)
- State persisted in `localStorage` key: `theme`
- Optional URL param: `?theme=dark` to force mode
- Use Tailwind `dark:` classes with `class` strategy

**Scope:**
- `/pairing/[code]/[round]` — public TV display (required)
- Other public pages — optional future extension

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_table_no.sql` | Add `table_no` column |
| `src/lib/swiss/types.ts` | Add `tableNo` to `Pairing` interface |
| `src/lib/swiss/pairing.ts` | Assign `tableNo` during generation |
| `src/app/api/rounds/[id]/generate/route.ts` | Save `table_no` to DB |
| `src/app/admin/ronde/[tournament_id]/page.tsx` | Display table_no column |
| `src/app/(public)/pairing/[code]/[round]/page.tsx` | **NEW** — TV-optimized page |
| `src/components/ui/theme-toggle.tsx` | **NEW** — Day/night toggle component |
| `tailwind.config.ts` | Add `darkMode: 'class'` if not present |

## Testing

### Unit Tests

```typescript
describe("generateSwissPairings with table numbers", () => {
  it("assigns table 1 to highest scoring pair", () => {
    const players = [
      makePlayer("a", 2, 1800),
      makePlayer("b", 2, 1750),
      makePlayer("c", 1, 1700),
      makePlayer("d", 1, 1650),
    ];
    const pairings = generateSwissPairings(players);

    expect(pairings[0].tableNo).toBe(1);
    expect(pairings[0].white.score).toBe(2);
  });

  it("assigns null tableNo to bye", () => {
    const players = [
      makePlayer("a", 1, 1800),
      makePlayer("b", 1, 1750),
      makePlayer("c", 0, 1700),
    ];
    const pairings = generateSwissPairings(players);

    const bye = pairings.find(p => p.black === null);
    expect(bye?.tableNo).toBeNull();
  });

  it("assigns sequential table numbers", () => {
    const players = Array.from({ length: 10 }, (_, i) =>
      makePlayer(String(i), 0, 1800 - i * 50)
    );
    const pairings = generateSwissPairings(players);

    const tableNos = pairings
      .filter(p => p.black !== null)
      .map(p => p.tableNo);

    expect(tableNos).toEqual([1, 2, 3, 4, 5]);
  });
});
```

### Manual Testing

1. Generate pairing untuk turnamen dengan 10 peserta
2. Verify meja 1 berisi pemain skor tertinggi
3. Verify bye tidak memiliki nomor meja
4. Verify admin page menampilkan nomor meja
5. Verify public TV page fit tanpa scroll
6. Verify theme toggle berfungsi dan persist setelah refresh
