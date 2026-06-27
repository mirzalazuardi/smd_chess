# Tasks: Import Peserta via CSV

Setiap task atomik: satu berkas, satu tujuan, bisa diverifikasi sendiri. Urutan menjaga dependensi. Referensi REQ merujuk `specs/csv-player-import.md`.

## Phase 1: Migrasi DB (REQ-1)

- [ ] **1.1** Buat `supabase/migrations/<timestamp>_make_contact_fields_nullable.sql` berisi:
  `ALTER TABLE registrations ALTER COLUMN wa_number DROP NOT NULL;`
  `ALTER TABLE registrations ALTER COLUMN proof_transfer_url DROP NOT NULL;`
  - Acceptance: berkas migrasi ada; gunakan timestamp lebih besar dari `20260614082726`.
- [ ] **1.2** Di `openspec/project.md` bagian skema `registrations`, tandai `wa_number` dan `proof_transfer_url` sebagai nullable (hapus/anotasi "NOT NULL").
  - Acceptance: deskripsi skema cocok dengan migrasi 1.1.

## Phase 2: Tokenizer CSV (TDD — REQ-2)

- [ ] **2.1** Buat `tests/import/csv.test.ts`. Tulis test gagal untuk `parseCsv`: (a) baris & sel sederhana terbagi benar, (b) string kosong → `[]`, (c) baris whitespace dibuang.
- [ ] **2.2** Buat `src/lib/import/csv.ts` dengan `parseCsv(text: string): string[][]` hingga test 2.1 hijau. Belum perlu dukungan quote.
- [ ] **2.3** Tambah test di `csv.test.ts`: sel ber-quote `"a,b"` tetap satu sel; `\r\n` ditangani; `""` di dalam quote → satu `"`. Lengkapi `parseCsv` hingga hijau.
  - Acceptance: `npm test tests/import/csv.test.ts` lulus.

## Phase 3: Skema validasi baris (TDD — REQ-5)

- [ ] **3.1** Di `src/lib/validation/schemas.ts`, tambah `importRowSchema` per REQ-5 (full_name, student_status, school_name dgn refine pelajar→wajib sekolah, wa_number opsional angka 10–15, email opsional, paid boolean). Export `ImportRowInput`.
  - Acceptance: `npx tsc --noEmit` lulus.
- [ ] **3.2** Buat `tests/import/import-row-schema.test.ts`: baris umum tanpa sekolah valid; pelajar tanpa sekolah invalid; wa berisi huruf invalid; email salah format invalid; baris minimal (hanya nama, status umum) valid.
  - Acceptance: test lulus terhadap `importRowSchema`.

## Phase 4: Pemetaan & validasi baris (TDD — REQ-3,4,6,7)

- [ ] **4.1** Buat `tests/import/parse-import.test.ts`. Test gagal untuk `mapImportRows` (REQ-4): status diturunkan dari `sekolah` (terisi→pelajar, kosong→umum); `lunas` "ya"→true, kosong→false; `lineNumber` benar (baris data pertama = 2); sel kosong → `undefined`.
- [ ] **4.2** Buat `src/lib/import/parse-import.ts` dengan `mapImportRows(records): MappedRow[]` hingga test 4.1 hijau.
- [ ] **4.3** Tambah test header (REQ-3): header benar lolos; header hilang/berbeda → hasil punya `headerError` dan tanpa baris data. Implement validasi header (mis. `parseImport(records)` yang mengembalikan `{ headerError? , rows }`, atau fungsi `validateHeader`).
- [ ] **4.4** Tambah test untuk `validateImportRows` (REQ-6): campuran baris valid & invalid → `valid` dan `invalid` terpisah; tiap `invalid` punya `lineNumber`, `full_name`, `reason`. Implement `validateImportRows` di `parse-import.ts` memakai `importRowSchema`.
- [ ] **4.5** Tambah test untuk `dedupeByName` (REQ-7): duplikat vs `existingNames` (case-insensitive) dilewati; duplikat dalam berkas yang sama dilewati (kemunculan pertama disimpan); `reason === "duplikat nama"`. Implement `dedupeByName` di `parse-import.ts`.
  - Acceptance: `npm test tests/import/parse-import.test.ts` lulus.

## Phase 5: API endpoint (REQ-8,9,10,11)

- [ ] **5.1** Buat `src/app/api/tournaments/[id]/import/route.ts` dengan handler `POST`. Tambah `requireAdmin()` (kembalikan `errorResponse` bila ada) dan ambil `params.id`.
- [ ] **5.2** Muat turnamen by `id` via `createServiceClient`. 404 bila tidak ada; 409 bila `status` bukan `draft`/`open` (REQ-8).
- [ ] **5.3** Baca `file` dari `formData()`. 400 bila tidak ada/kosong. Decode ke teks, jalankan `parseCsv` lalu validasi header; bila `headerError` → 400 `{ error: headerError }` (REQ-9).
- [ ] **5.4** Jalankan `mapImportRows` → `validateImportRows`. Muat `full_name` registrasi existing turnamen ini untuk `existingNames`, jalankan `dedupeByName` (REQ-10).
- [ ] **5.5** Untuk tiap baris `unique`: generate `registration_id` berurutan (`generateRegistrationId` + `currentYear`, lanjut dari count `CATUR{year}-%`), insert dengan `proof_transfer_url: null`, `email`/`wa_number` null bila kosong, `paid` dari baris, `is_active: true`. Tangani error insert per baris → pindahkan ke `skipped` dengan alasan.
- [ ] **5.6** Balas 200 `{ imported, skipped }` dengan `skipped` gabungan invalid + duplicates diurutkan `lineNumber` (REQ-11).
  - Acceptance: `npx tsc --noEmit` lulus; smoke test manual via curl/UI berhasil di Phase 7.

## Phase 6: UI (REQ-12,13,14)

- [ ] **6.1** Buat `public/template-import-peserta.csv`: baris header `nama,sekolah,lunas,wa,email` + 2 baris contoh (1 pelajar dgn sekolah, 1 umum tanpa sekolah).
- [ ] **6.2** Buat `src/components/forms/import-peserta-form.tsx` (`"use client"`): input file `.csv`, tombol "Impor", submit FormData (field `file`) ke `POST /api/tournaments/[id]/import`. Props: `tournamentId`.
- [ ] **6.3** Di komponen yang sama, render laporan hasil: jumlah `imported` + tabel `skipped` (baris, nama, alasan); tampilkan pesan saat error.
- [ ] **6.4** Buat `src/app/admin/turnamen/[id]/import/page.tsx` (server component): muat turnamen, gate `status` (bukan draft/open → notice tanpa form), tampilkan instruksi + tautan unduh template + render `ImportPesertaForm`.
- [ ] **6.5** Di `src/app/admin/turnamen/[id]/edit/page.tsx`, tambah tautan/tombol "Import Peserta (CSV)" ke `/admin/turnamen/[id]/import`.

## Phase 7: Verifikasi

- [ ] **7.1** Jalankan `npm test` — semua lulus (lama + baru).
- [ ] **7.2** Jalankan `npx tsc --noEmit` — tanpa error tipe.
- [ ] **7.3** Manual: unggah CSV valid ke turnamen draft — peserta masuk, status pelajar/umum benar, `paid` sesuai `lunas`.
- [ ] **7.4** Manual: CSV dengan baris invalid + duplikat — baris valid masuk, sisanya muncul di laporan dengan alasan.
- [ ] **7.5** Manual: CSV header salah — ditolak dengan pesan, tidak ada yang diimpor.
- [ ] **7.6** Manual: buka halaman impor untuk turnamen `ongoing` — form tidak muncul / endpoint balas 409.

## Phase 8: Dokumentasi

- [ ] **8.1** Update `openspec/project.md` tabel API Routes — tambah `POST /api/tournaments/[id]/import`.
- [ ] **8.2** Tambah catatan singkat cara impor CSV di dokumentasi admin (mis. `README.md` atau `docs/` bila ada panduan admin).
