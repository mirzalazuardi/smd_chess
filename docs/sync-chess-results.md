# Panduan Sinkronisasi chess-results.com

Fitur sinkronisasi dua arah antara SMD Chess dan chess-results.com.

## Ringkasan

| Arah | Metode | Yang Dibutuhkan |
|------|--------|-----------------|
| **chess-results → SMD** | Scrape HTML | URL turnamen chess-results.com |
| **SMD → chess-results** | Export TRF/CSV | Swiss-Manager (berbayar) untuk upload |

> chess-results.com **tidak memiliki API publik**. Import menggunakan HTML scraping, export menghasilkan file standar FIDE (TRF) yang bisa diimpor ke Swiss-Manager.

---

## A. Import: chess-results.com → SMD Chess

### Langkah

1. Buka **Dashboard Admin** → klik **Sinkronisasi** (atau langsung ke `/admin/sync`)
2. Masukkan **URL turnamen** dari chess-results.com (format: `https://chess-results.com/tnr123456.aspx`)
3. Masukkan **ID turnamen target** di SMD Chess (UUID, bisa dilihat dari URL halaman edit turnamen)
4. Klik **Pratinjau** — sistem akan menampilkan nama turnamen, jumlah ronde, dan jumlah peserta
5. Jika data sesuai, klik **Impor**

### Yang Diimpor

| Data | Target di SMD |
|------|--------------|
| Nama turnamen | (referensi saja, tidak diubah) |
| Daftar pemain | `registrations` — `paid=TRUE`, `is_active=TRUE` |
| Pairing per ronde | `tournament_rounds` + `matches` |
| Hasil pertandingan | `matches` (update score + status) |

### Catatan Penting

- Import **hanya bisa** ke turnamen yang masih `draft` atau `open`
- Peserta impor otomatis dianggap **lunas** (`paid=TRUE`)
- Pemain yang sudah terdaftar (berdasarkan nama, case-insensitive) **dilewati**
- chess-results.com kadang mengubah struktur HTML — jika gagal parse, coba lagi nanti
- Ada jeda 1.5 detik antar request untuk menghormati rate limiting

### Format URL chess-results.com

```
https://chess-results.com/tnr{ID}.aspx?lan=18
```

Parameter yang digunakan otomatis:
- `lan=18` — Bahasa Indonesia
- `art=0` — overview (metadata turnamen)
- `art=1` — daftar pemain
- `art=2&rd=N` — pairing ronde ke-N
- `art=4` — cross table (hasil per pemain)
- `zeilen=99999` — tampilkan semua baris

---

## B. Export: SMD Chess → TRF/CSV

### Export TRF (FIDE Standard)

1. Buka halaman **Edit Turnamen** (`/admin/turnamen/[id]/edit`)
2. Klik **Export TRF**
3. File `.trf` akan terdownload
4. Buka file di **Swiss-Manager** (File → Import → TRF)
5. Dari Swiss-Manager, upload ke chess-results.com

Format TRF mengikuti standar **FIDE C04 Annex 2 (TRF16)**.

### Export CSV (Daftar Pemain)

1. Buka halaman **Edit Turnamen**
2. Klik **Export CSV**
3. File `.csv` akan terdownload dengan kolom: `no, nama, rating, status, sekolah`

### Catatan

- Export **hanya tersedia** jika turnamen memiliki peserta dengan `paid=TRUE`
- Upload ke chess-results.com **memerlukan lisensi Swiss-Manager** (berbayar)
- TRF menggunakan default: federasi `INA`, kota `Sumedang`

---

## Batasan & Kendala

| Kendala | Dampak |
|---------|--------|
| chess-results.com tidak punya API | Import bergantung pada HTML scraping — bisa break jika struktur berubah |
| Perlu lisensi Swiss-Manager | Export hanya menghasilkan file; upload manual via Swiss-Manager |
| Rate limiting | Maksimal ~1 request/detik; turnamen besar (>100 pemain) perlu waktu |
| Format halaman bervariasi | Scraper didesain untuk format standar; halaman dengan layout berbeda mungkin gagal |
| Tidak ada live sync | Semua sinkronisasi manual (admin trigger) |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "chess-results.com tidak merespon" | Cek koneksi internet, coba lagi nanti |
| "Gagal membaca data pemain" | Struktur HTML mungkin berbeda — laporkan URL turnamen |
| "URL chess-results.com tidak valid" | Pastikan format URL: `https://chess-results.com/tnr...` |
| TRF tidak bisa dibuka Swiss-Manager | Pastikan Swiss-Manager versi terbaru; coba import sebagai TRF16 |
| Pemain tidak muncul di pairing setelah import | Pastikan `paid=TRUE` — peserta impor otomatis lunas |

---

## File Terkait

```
src/lib/sync/
├── scraper.ts        # HTML scraper chess-results.com
├── mapper.ts         # Mapping chess-results → SMD schema
├── trf-export.ts     # TRF format generator
└── csv-export.ts     # CSV export

src/app/api/sync/
├── import/chess-results/route.ts   # POST import
└── preview/chess-results/route.ts  # GET preview

src/app/api/tournaments/[id]/export/
├── trf/route.ts      # GET TRF download
└── csv/route.ts      # GET CSV download

src/app/admin/sync/page.tsx         # Admin sync page
```
