# Proposal: Import Peserta via CSV

## Problem

Saat ini peserta hanya bisa masuk lewat form pendaftaran publik satu per satu, lengkap dengan unggah bukti transfer. Untuk turnamen yang pesertanya didaftarkan secara offline (kolektif dari sekolah, walk-in, atau hasil rekap panitia), admin harus mengetik ulang puluhan peserta satu per satu. Ini lambat dan rawan salah ketik.

Admin butuh cara untuk memasukkan banyak peserta sekaligus ke turnamen yang masih `draft` atau `open` dengan mengunggah satu berkas CSV.

## Solution

Tambahkan halaman admin untuk mengunggah CSV berisi banyak peserta ke satu turnamen. Setiap baris menjadi satu `registration`.

**Format CSV** (header Bahasa Indonesia, urutan tetap):

| Kolom | Wajib | Map ke | Catatan |
|---|---|---|---|
| `nama` | ✅ | `full_name` | 1–100 karakter |
| `sekolah` | opsional | `school_name` | menentukan status (lihat bawah) |
| `lunas` | opsional | `paid` | `ya`/`tidak` (default `tidak` → `FALSE`) |
| `wa` | opsional | `wa_number` | hanya angka bila diisi |
| `email` | opsional | `email` | format email bila diisi |

**Aturan turunan:**
- `student_status` **diturunkan dari `sekolah`**: kolom `sekolah` terisi → `pelajar`; kosong → `umum`. Tidak ada kolom status terpisah.
- `paid` diambil dari `lunas`; default `FALSE` (perlu verifikasi pembayaran seperti biasa).
- Kolom kontak yang kosong disimpan sebagai `NULL`.

**Perilaku impor (baris valid masuk, baris bermasalah dilaporkan):**
- Parse CSV → validasi tiap baris → pisahkan `valid` dan `invalid`.
- **Deteksi duplikat:** berdasarkan `full_name` (case-insensitive) — dibandingkan terhadap registrasi yang sudah ada di turnamen tersebut **dan** terhadap baris sebelumnya dalam berkas yang sama. Duplikat dilewati dan dilaporkan.
- Baris valid & unik di-insert; `registration_id` di-generate berurutan (`CATUR{YEAR}-{SEQ}`), `proof_transfer_url = NULL`.
- Layar hasil menampilkan: **N berhasil diimpor**, **M dilewati**, dengan tabel alasan per baris (mis. "baris 4: nama wajib diisi", "baris 7: duplikat nama").

## Scope

- Migrasi DB: `wa_number` dan `proof_transfer_url` menjadi nullable (`email` sudah nullable).
- Tokenizer CSV murni `src/lib/import/csv.ts` (quote-aware, tanpa I/O).
- Pemetaan & validasi baris `src/lib/import/parse-import.ts` + skema Zod `importRowSchema` di `src/lib/validation/schemas.ts`.
- Endpoint `POST /api/tournaments/[id]/import` (admin-guarded) untuk validasi, dedupe, insert, dan laporan.
- Halaman admin `src/app/admin/turnamen/[id]/import/page.tsx` + komponen unggah/laporan client.
- Berkas template `public/template-import-peserta.csv` yang bisa diunduh admin.
- Tautan "Import Peserta (CSV)" dari halaman edit turnamen.

## Out of Scope

- Impor untuk turnamen `ongoing`/`finished` (hanya `draft`/`open`).
- Unggah bukti transfer per baris (peserta impor tanpa bukti; `proof_transfer_url = NULL`).
- Kolom `chess_rating` dan kolom status eksplisit (status diturunkan dari `sekolah`).
- Update/upsert peserta yang sudah ada (duplikat dilewati, bukan ditimpa).
- Format selain CSV (xlsx, dll.).
- Mengubah logika filter `paid = TRUE` pada pairing/standings.

## Success Criteria

1. Admin mengunggah CSV ke turnamen `draft`/`open`; baris valid menjadi peserta baru dengan `registration_id` berurutan.
2. Baris dengan `sekolah` terisi tersimpan sebagai `pelajar`; `sekolah` kosong sebagai `umum`.
3. `lunas = ya` → `paid = TRUE`; selain itu / kosong → `paid = FALSE` (default).
4. Baris duplikat nama (vs data lama atau dalam berkas) dilewati dan muncul di laporan dengan alasannya.
5. Baris tidak valid (mis. nama kosong, wa bukan angka, email salah format) dilewati dan dilaporkan; baris valid tetap masuk.
6. Header CSV salah/hilang ditolak dengan pesan jelas (tidak ada yang diimpor).
7. Impor pada turnamen `ongoing`/`finished` ditolak (halaman tidak mengizinkan / endpoint membalas 409).
8. Peserta impor menghormati filter `paid = TRUE` — yang belum lunas tidak masuk pairing/standings.
9. Semua test unit lulus (`npm test`), termasuk test baru untuk parser dan validasi impor.
