# Spec: Import Peserta via CSV

Requirement bernomor agar tiap task bisa diuji terhadap satu REQ.

## Data Model

### REQ-1 — Kolom kontak nullable
`registrations.wa_number` dan `registrations.proof_transfer_url` HARUS menjadi nullable.
`registrations.email` sudah nullable (migrasi `20260614082726`). `paid` tetap `BOOLEAN NOT NULL DEFAULT FALSE`.
Constraint `UNIQUE(tournament_id, email)` tetap; banyak baris dengan `email = NULL` diperbolehkan (Postgres memperlakukan NULL sebagai distinct).

## CSV Tokenizer (`src/lib/import/csv.ts`)

### REQ-2 — `parseCsv(text: string): string[][]`
Fungsi murni mengubah teks CSV menjadi array baris berisi array sel.
- Pemisah sel: koma `,`. Pemisah baris: `\n` (toleran terhadap `\r\n`).
- Mendukung sel ber-quote `"..."`; di dalam quote, koma dan baris baru dianggap literal.
- Quote ganda di dalam quote (`""`) → satu karakter `"`.
- Baris kosong (hanya whitespace) dibuang.
- Tidak melakukan I/O dan tidak melempar untuk input CSV wajar; mengembalikan `[]` untuk string kosong.

## Pemetaan & Validasi Baris (`src/lib/import/parse-import.ts`)

### REQ-3 — Header wajib & urutan
Baris pertama adalah header. Header (case-insensitive, di-trim) HARUS tepat: `nama, sekolah, lunas, wa, email`.
Jika header tidak cocok (kolom hilang/berbeda), kembalikan hasil dengan `headerError: string` (Bahasa Indonesia) dan TIDAK ada baris data yang diproses.

### REQ-4 — `mapImportRows(records: string[][]): MappedRow[]`
Untuk tiap baris data (mulai indeks 1), hasilkan objek dengan `lineNumber` (nomor baris di berkas, 1-based termasuk header → baris data pertama = 2) dan field mentah:
- `full_name` ← `nama` (di-trim)
- `school_name` ← `sekolah` (di-trim; string kosong → `undefined`)
- `student_status` **diturunkan**: `school_name` terisi → `"pelajar"`, kosong → `"umum"`
- `paid` ← `lunas`: `ya`/`true`/`1`/`lunas` (case-insensitive) → `true`; selain itu / kosong → `false`
- `wa_number` ← `wa` (di-trim; kosong → `undefined`)
- `email` ← `email` (di-trim; kosong → `undefined`)

### REQ-5 — `importRowSchema` (Zod, di `schemas.ts`)
Memvalidasi satu objek baris hasil REQ-4:
- `full_name`: wajib, 1–100 karakter.
- `student_status`: `"pelajar" | "umum"`.
- `school_name`: opsional, ≤100; WAJIB ada jika `student_status === "pelajar"`.
- `wa_number`: opsional; bila ada, hanya angka, 10–15 digit.
- `email`: opsional; bila ada, format email valid.
- `paid`: boolean.
Reuse aturan yang sama dengan `registrationSchema` di mana memungkinkan (jangan duplikasi konstanta tanpa alasan).

### REQ-6 — `validateImportRows(mapped: MappedRow[]): { valid: ValidRow[]; invalid: InvalidRow[] }`
Jalankan `importRowSchema` pada tiap baris. Baris gagal → `invalid` berisi `{ lineNumber, full_name, reason }` dengan `reason` = pesan error pertama (Bahasa Indonesia). Baris lulus → `valid` (data ter-parse + `lineNumber`).

### REQ-7 — Dedupe berdasarkan nama
`dedupeByName(valid: ValidRow[], existingNames: string[]): { unique: ValidRow[]; duplicates: InvalidRow[] }`.
- Bandingkan `full_name` secara case-insensitive + trim.
- Duplikat bila cocok dengan salah satu `existingNames` (registrasi yang sudah ada di turnamen) ATAU dengan baris valid sebelumnya dalam berkas yang sama.
- Duplikat masuk `duplicates` dengan `reason` = "duplikat nama". Kemunculan pertama tetap di `unique`.

## API (`POST /api/tournaments/[id]/import`)

### REQ-8 — Guard & gating
- Wajib admin: pakai `requireAdmin()`; jika `errorResponse` ada, kembalikan.
- Muat turnamen by `id`. 404 bila tidak ada.
- `status` HARUS `draft` atau `open`; selain itu balas 409 dengan pesan jelas.

### REQ-9 — Terima & parse berkas
- Baca file dari `multipart/form-data` (field `file`). Bila tidak ada / kosong → 400.
- Decode ke teks, jalankan `parseCsv` → `mapImportRows`. Jika `headerError` → 400 `{ error: headerError }`.

### REQ-10 — Validasi, dedupe, insert
- `validateImportRows` → `valid` / `invalid`.
- Ambil `full_name` registrasi yang sudah ada di turnamen ini untuk `existingNames`, jalankan `dedupeByName`.
- Untuk tiap baris `unique`: generate `registration_id` berurutan (`CATUR{YEAR}-{SEQ}`, lanjut dari count tahun berjalan), insert dengan `tournament_id`, `proof_transfer_url = NULL`, `email`/`wa_number` `NULL` bila kosong, `paid` dari baris, `is_active = TRUE`.
- Filter `paid = TRUE` pada pairing/standings TIDAK boleh diubah; baris dengan `paid=false` hanya masuk sebagai peserta belum-lunas.

### REQ-11 — Respons laporan
Balas 200 `{ imported: number, skipped: { lineNumber, full_name, reason }[] }`.
`skipped` = gabungan `invalid` (REQ-6) + `duplicates` (REQ-7), diurutkan menaik berdasarkan `lineNumber`.

## UI

### REQ-12 — Halaman impor (server component)
`src/app/admin/turnamen/[id]/import/page.tsx`:
- Muat turnamen; jika `status` bukan `draft`/`open`, tampilkan notice dan TIDAK render form unggah.
- Tampilkan instruksi format, tautan unduh `template-import-peserta.csv`, dan render komponen form client.

### REQ-13 — Komponen form (client)
`src/components/forms/import-peserta-form.tsx` (`"use client"`):
- Input file `.csv`, tombol "Impor".
- Submit ke `POST /api/tournaments/[id]/import` (FormData field `file`).
- Saat sukses tampilkan laporan: jumlah berhasil + tabel `skipped` (baris, nama, alasan). Saat gagal tampilkan pesan error.

### REQ-14 — Template & entry point
- `public/template-import-peserta.csv` berisi baris header `nama,sekolah,lunas,wa,email` + 1–2 baris contoh.
- Halaman edit turnamen (`src/app/admin/turnamen/[id]/edit/page.tsx`) menampilkan tombol/tautan "Import Peserta (CSV)" ke halaman impor.
