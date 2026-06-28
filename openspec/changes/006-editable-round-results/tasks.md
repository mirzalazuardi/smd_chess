# Tasks: Editable Round Results

Atomic task list. Kerjakan berurutan.

## T-1: API guard — tolak edit hasil jika ronde berikutnya sudah ada

**File:** `src/app/api/rounds/[id]/results/route.ts`

- Setelah update match scores, query: apakah ada `tournament_rounds` dengan `round_number > current_round_number` pada turnamen yang sama?
- Jika ADA → rollback? Tidak perlu (score sudah terlanjur ter-update per-match). Sebagai gantinya: **cek di awal**, sebelum update.
- Cek di awal: ambil round_number ronde ini, cek apakah ada ronde berikutnya. Jika ada → 409 `{ error: "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah" }`.
- Jaga agar `round.status` tetap `"completed"` setelah re-save.

## T-2: ResultInputForm — terima initial values

**File:** `src/components/ui/result-input-form.tsx`

- Tambah optional prop `initialResults: Record<string, { p1: number; p2: number | null }>`.
- Jika `initialResults` diberikan, pre-populate state `results` di `useState`.
- Tidak ada perubahan perilaku lain.

## T-3: Admin page — conditional rendering + tombol Edit Hasil

**File:** `src/app/admin/ronde/[tournament_id]/page.tsx`

- Untuk setiap ronde, hitung `isLatestRound = index === rounds.length - 1`.
- Ganti kondisi line 224 (`round.status === "ongoing"`) menjadi:
  - `ongoing` → tampil `ResultInputForm` (seperti sekarang)
  - `completed` DAN `isLatestRound` → tampilkan hasil readonly + tombol **"Edit Hasil"**
  - `completed` DAN bukan `isLatestRound` → tampilkan hasil readonly, tanpa tombol
- State: `editingRoundId` (string | null) — saat diklik, set ke round.id, tampilkan `ResultInputForm`.
- Kirim `initialResults` ke `ResultInputForm`: mapping dari match results yang sudah ada.
- Setelah save sukses → reset `editingRoundId` ke null (kembali ke tampilan readonly).
- Tombol "Edit Hasil" dibungkus client component kecil atau pakai `"use client"` di parent — halaman ini server component, perlu client wrapper.

## T-4: Test — API guard

**File:** `tests/api/rounds-results-edit.test.ts` (baru)

- Test: edit hasil ronde terakhir → sukses 200
- Test: edit hasil ronde yang sudah punya ronde berikutnya → 409
- Test: edit hasil dengan skor invalid → 400
