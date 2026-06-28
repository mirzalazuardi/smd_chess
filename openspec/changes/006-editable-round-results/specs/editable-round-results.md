# Spec: Editable Round Results

## Concepts

- **Latest round** — ronde dengan `round_number` tertinggi pada suatu turnamen. Hanya ronde terakhir yang hasilnya bisa diedit ulang.
- **Locked round** — ronde yang sudah memiliki ronde berikutnya (round_number + 1 exists). Hasilnya terkunci permanen.
- **Score computation** — skor pemain dihitung ulang dari `match` results oleh `buildPlayerHistory` setiap kali pairing digenerate. Tidak ada kolom skor yang perlu disinkronkan secara manual.

## Requirements

### REQ-1: Edit hasil hanya untuk ronde terakhir (API guard)

**File:** `src/app/api/rounds/[id]/results/route.ts`

Sebelum update match scores, endpoint `PATCH` wajib memeriksa:

1. Ambil `round_number` dan `tournament_id` dari ronde yang akan diedit.
2. Query: apakah ada `tournament_rounds` dengan `tournament_id` sama dan `round_number > current_round_number`?
3. Jika ADA → response `409 Conflict` dengan body `{ error: "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah" }`.
4. Jika TIDAK → lanjutkan update seperti biasa.

**Rationale:** Mencegah inkonsistensi — jika ronde berikutnya sudah digenerate dengan skor lama, mengubah skor setelahnya akan membuat pairing ronde berikutnya tidak valid.

### REQ-2: ResultInputForm menerima initial values

**File:** `src/components/ui/result-input-form.tsx`

Tambahkan optional prop:

```ts
interface Props {
  roundId: string;
  matches: (Match & { white_name?: string; black_name?: string })[];
  initialResults?: Record<string, { p1: number; p2: number | null }>;
}
```

Jika `initialResults` diberikan, state `results` di-inisialisasi dengan nilai tersebut:

```ts
const [results, setResults] = useState<Record<string, { p1: number; p2: number | null }>>(
  initialResults ?? {}
);
```

Perilaku lain (save, error handling) tidak berubah.

### REQ-3: Tampilan hasil readonly + tombol "Edit Hasil"

**File:** `src/app/admin/ronde/[tournament_id]/page.tsx`

Halaman admin ronde tetap Server Component. Bagian toggle edit dibungkus dalam client component (`EditResultsToggle`) atau inline dengan `"use client"` directive.

#### Kondisi tampilan per ronde

| Status | Posisi | Tampilan |
|--------|--------|----------|
| `ongoing` | — | `ResultInputForm` langsung tampil |
| `completed` | Ronde terakhir (isLatestRound) | Hasil readonly + tombol "Edit Hasil" |
| `completed` | Bukan ronde terakhir | Hasil readonly saja |

#### Perilaku tombol "Edit Hasil"

1. State: `editingRoundId: string | null` (awal: null)
2. Klik tombol → `setEditingRoundId(round.id)`
3. `ResultInputForm` muncul dengan `initialResults` diisi dari data match yang sudah ada
4. Setelah save sukses → `setEditingRoundId(null)` → kembali ke tampilan readonly
5. Jika tidak ada match dengan lawan (hanya bye), tombol "Edit Hasil" tidak muncul

#### Komputasi initialResults

Dari `round.matches` yang sudah ada:
```ts
const initialResults: Record<string, { p1: number; p2: number | null }> = {};
for (const m of round.matches) {
  if (m.player2_id && m.player1_score !== null) {
    initialResults[m.id] = {
      p1: m.player1_score,
      p2: m.player2_score,
    };
  }
}
```

### REQ-4: Tidak ada perubahan database schema

Tidak ada kolom baru, tidak ada migrasi. Semua perubahan di application layer.

### REQ-5: Tidak mengubah flow generate pairing

`POST /api/tournaments/[id]/rounds` tetap sama. Guard yang ada (`prevRound.status !== "completed"` → 400) tetap berlaku. `buildPlayerHistory` tetap membaca dari match results.

## Skenario Test (Bahasa Indonesia)

### Happy Path

**Given** Ronde 1 sudah selesai dengan hasil: Meja 1 (A vs B: 1-0), Meja 2 (C vs D: 0-1)
**And** Belum ada Ronde 2
**When** Admin klik "Edit Hasil" pada Ronde 1, lalu ubah Meja 2 menjadi 0.5-0.5, klik "Simpan Hasil"
**Then** Hasil Meja 2 berubah menjadi 0.5-0.5
**And** Ronde 1 tetap status "completed"
**And** Generate Ronde 2 akan menggunakan skor yang sudah dikoreksi (A=1, B=0, C=0.5, D=0.5)

### Error: Ronde berikutnya sudah ada

**Given** Ronde 1 sudah selesai, Ronde 2 sudah digenerate
**When** Admin mencoba edit hasil Ronde 1 via API
**Then** Response 409 "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah"

### Edge: Hanya bye

**Given** Ronde 1 hanya berisi 1 pemain (bye)
**When** Admin melihat halaman ronde
**Then** Tidak ada tombol "Edit Hasil" yang muncul

### UX: Hanya ronde terakhir yang bisa diedit

**Given** Ronde 1 completed, Ronde 2 completed (belum ada Ronde 3)
**When** Admin melihat halaman ronde
**Then** Ronde 1: hasil readonly (tanpa tombol edit — bukan ronde terakhir)
**And** Ronde 2: hasil readonly + tombol "Edit Hasil" (ronde terakhir, belum ada ronde berikutnya)

### UX: Ronde ongoing tampil form, ronde completed sebelumnya readonly

**Given** Ronde 1 completed, Ronde 2 ongoing
**When** Admin melihat halaman ronde
**Then** Ronde 1: hasil readonly saja (Ronde 2 sudah ada, API guard akan tolak edit)
**And** Ronde 2: ResultInputForm langsung tampil (ongoing)

## Out of Scope

- Edit hasil setelah ronde berikutnya sudah digenerate
- Drag-and-drop atau UI kompleks
- Batch edit multiple rounds
- Riwayat perubahan (audit log)
