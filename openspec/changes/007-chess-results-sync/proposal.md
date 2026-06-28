# Proposal: Sinkronisasi chess-results.com

## Problem

Turnamen catur di Percasi Sumedang kadang berjalan paralel di dua sistem:
1. **SMD Chess** — sistem internal untuk registrasi, pairing, dan klasemen
2. **chess-results.com** — platform publik yang menjadi standar de facto untuk publikasi hasil turnamen catur

Saat ini, admin harus memasukkan data dua kali: sekali di SMD Chess dan sekali di Swiss-Manager (yang kemudian diunggah ke chess-results.com). Ini lambat, rawan inkonsistensi, dan buang waktu.

Selain itu, jika turnamen sudah berjalan di chess-results.com, tidak ada cara mudah untuk menarik datanya ke SMD Chess untuk keperluan internal.

## Solution

Bangun modul sinkronisasi dua arah:

### Arah 1: chess-results.com → SMD Chess (Import)

Admin memberikan URL turnamen di chess-results.com (format `chess-results.com/tnr{ID}.aspx`). Sistem:
1. Scrape halaman overview untuk metadata turnamen (nama, jumlah ronde, tanggal)
2. Scrape daftar pemain + rating dari halaman player list (`art=1`)
3. Scrape pairing per ronde dari halaman pairings (`art=2`)
4. Scrape hasil per ronde dari cross table (`art=4`)
5. Validasi dan mapping ke skema SMD Chess
6. Insert/bulk-upsert ke Supabase

**Mapping data:**
| chess-results.com | SMD Chess |
|---|---|
| Tournament name, rounds | `tournaments` |
| Player list (name, rating, club) | `registrations` (paid=TRUE bypass) |
| Round pairings | `tournament_rounds` + `matches` |
| Round results | `matches` (update scores) |
| Standings | computed dari matches (existing code) |

### Arah 2: SMD Chess → chess-results.com (Export)

Export data turnamen SMD Chess ke format yang bisa diimpor Swiss-Manager:
1. **TRF (Tournament Report File)** — format standar FIDE, diterima Swiss-Manager
2. **CSV** — format sederhana untuk import massal pemain
3. **Excel-like CSV** — meniru format export chess-results.com (pairing + hasil per ronde)

Karena upload ke chess-results.com memerlukan lisensi Swiss-Manager (berbayar), arah ini fokus pada **export file** yang siap diimpor ke Swiss-Manager oleh panitia yang memiliki lisensi.

## Technical Design

### Modul Scraper (`src/lib/sync/scraper.ts`)

```
chess-results.com/tnr{ID}.aspx
├── art=0 → overview → metadata turnamen
├── art=1 → player list → nama, rating, klub
├── art=2 → pairings per ronde → meja, putih, hitam
└── art=4 → cross table → hasil per ronde per pemain
```

- Fetch HTML via server-side `fetch` (Next.js Route Handler)
- Parse dengan regex + string splitting (tidak perlu library HTML parser untuk halaman yang terstruktur sederhana)
- Return typed objects yang sudah tervalidasi Zod
- Support parameter `lan=18` (Bahasa Indonesia) untuk teks yang lebih mudah diparse

### Modul TRF Export (`src/lib/sync/trf-export.ts`)

Format TRF (FIDE Tournament Report File) — spesifikasi mengacu pada [FIDE TRF16 standard](https://www.fide.com/FIDE/handbook/C04Annex2_TRF16.pdf):
- Header: nama turnamen, kota, tanggal, arbiter
- Player section: kode, nama, rating, federasi
- Round results: pairing + skor + warna

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/sync/import/chess-results` | Import dari URL chess-results.com (admin) |
| `GET` | `/api/tournaments/[id]/export/trf` | Export TRF file (admin) |
| `GET` | `/api/tournaments/[id]/export/csv` | Export CSV player list (admin) |

### UI

- Halaman admin: `/admin/sync` — dashboard sinkronisasi
- Form import: input URL chess-results.com → preview data → konfirmasi import
- Tombol export di halaman turnamen: "Export TRF", "Export CSV"

## Scope

### In Scope
- Scrape chess-results.com halaman overview, player list, pairings, cross table
- Mapping data chess-results.com → SMD Chess schema
- Import dengan preview + konfirmasi (tidak langsung insert)
- Export TRF format (FIDE standard)
- Export CSV player list
- Admin-only access untuk semua endpoint sync

### Out of Scope
- Upload langsung ke chess-results.com (perlu lisensi Swiss-Manager)
- Scraping halaman yang berbeda format (beberapa turnamen punya layout berbeda — hanya format standar yang didukung)
- Live sync / scheduled sync (manual trigger saja)
- PGN export (game notation)
- Import TRF dari chess-results.com (fokus ke HTML scraping untuk import)
- Mendeteksi turnamen fiktif (dummy tournaments dari Swiss-Manager learning)

## Success Criteria

1. Admin memasukkan URL chess-results.com → sistem menampilkan preview data turnamen (nama, jumlah pemain, jumlah ronde)
2. Admin konfirmasi import → data pemain, ronde, pairing, dan hasil masuk ke SMD Chess
3. Pemain yang sudah ada di SMD Chess (berdasarkan nama) tidak diduplikasi
4. Export TRF menghasilkan file yang valid dan bisa dibuka di Swiss-Manager
5. Export CSV menghasilkan file dengan header yang konsisten
6. Semua endpoint hanya bisa diakses admin
7. Test unit untuk parser HTML dan TRF generator lulus

## Constraints

- chess-results.com TIDAK memiliki API — scraping adalah satu-satunya cara
- chess-results.com bisa mengubah struktur HTML sewaktu-waktu → parser harus defensive
- Upload ke chess-results.com memerlukan Swiss-Manager (berbayar) — tidak bisa diotomatisasi penuh
- Rate limiting: jangan bombardir chess-results.com dengan request
- TRF format punya spesifikasi ketat — harus mengikuti standar FIDE
