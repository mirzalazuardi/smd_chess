# Panduan Admin — SMD Chess

Panduan lengkap untuk mengelola turnamen catur menggunakan SMD Chess.

---

## Daftar Isi

1. [Login Admin](#1-login-admin)
2. [Membuat Turnamen](#2-membuat-turnamen)
3. [Mengubah Status Turnamen](#3-mengubah-status-turnamen)
4. [Verifikasi Pembayaran](#4-verifikasi-pembayaran)
5. [Generate Pairing (Swiss)](#5-generate-pairing-swiss)
6. [Input Hasil Pertandingan](#6-input-hasil-pertandingan)
7. [Lihat Klasemen](#7-lihat-klasemen)

---

## 1. Login Admin

1. Buka halaman admin: `https://[domain]/admin/login`
2. Masukkan **email** dan **password** yang sudah didaftarkan di Supabase Auth
3. Klik tombol **Masuk**
4. Setelah berhasil login, Anda akan diarahkan ke Dashboard Admin

> **Catatan:** Akun admin dibuat melalui Supabase Dashboard → Authentication → Add User. Hubungi technical lead untuk pembuatan akun.

---

## 2. Membuat Turnamen

1. Dari dashboard, klik menu **Turnamen** di navigasi atas
2. Klik tombol **Buat Turnamen**
3. Isi formulir:

| Field | Keterangan | Contoh |
|-------|-----------|--------|
| **Kode Turnamen** | Huruf kecil, angka, underscore. Tidak boleh spasi. | `sumedang_open_2026` |
| **Nama Turnamen** | Nama lengkap turnamen | `Sumedang Open 2026` |
| **Deskripsi** | Opsional. Informasi tambahan | `Turnamen tahunan Percasi Sumedang` |
| **Jumlah Ronde** | 1-20 ronde | `7` |

4. Klik **Buat Turnamen**
5. Turnamen baru akan muncul di daftar dengan status **Draft**

---

## 3. Mengubah Status Turnamen

Turnamen memiliki 4 status:

| Status | Artinya |
|--------|---------|
| **Draft** | Belum dipublikasikan, hanya admin yang bisa lihat |
| **Pendaftaran Buka** | Peserta bisa mendaftar melalui halaman `/daftar` |
| **Sedang Berlangsung** | Pertandingan sedang berjalan |
| **Selesai** | Semua ronde selesai |

**Cara mengubah status:**

1. Buka menu **Turnamen**
2. Klik **Edit** pada turnamen yang ingin diubah
3. Pilih status baru di dropdown **Status**
4. Klik **Simpan Perubahan**

> **Alur normal:** Draft → Pendaftaran Buka (setelah siap) → Sedang Berlangsung (setelah pairing dimulai) → Selesai

---

## 4. Verifikasi Pembayaran

Setiap peserta yang mendaftar akan mengunggah bukti transfer. Admin harus memverifikasi sebelum peserta masuk pairing.

1. Buka menu **Pembayaran** di navigasi atas
2. Pilih turnamen yang ingin dicek
3. Anda akan melihat tabel pendaftar dengan kolom:

| Kolom | Keterangan |
|-------|-----------|
| ID | Nomor registrasi unik (`CATUR2026-XXX`) |
| Nama | Nama lengkap + email peserta |
| Status | Pelajar / Umum |
| Rating | Rating catur (jika diisi) |
| Bukti | Klik **Lihat** untuk melihat bukti transfer |
| Pembayaran | Tombol **Lunas** / **Belum Lunas** |

4. Klik **Lihat** untuk memeriksa bukti transfer
5. Jika bukti valid, klik tombol **Belum Lunas** → berubah menjadi **Lunas**
6. Jika ingin membatalkan, klik **Lunas** → berubah menjadi **Belum Lunas**

**Filter pembayaran:**

Klik filter di atas tabel:
- **Semua** — menampilkan semua pendaftar
- **Belum Lunas** — menampilkan yang belum diverifikasi
- **Lunas** — menampilkan yang sudah diverifikasi

> **Penting:** Hanya peserta dengan status **Lunas** yang akan masuk ke dalam pairing.

---

## 5. Generate Pairing (Swiss)

Sistem menggunakan **algoritma Swiss** untuk membuat pasangan pertandingan secara otomatis.

1. Pastikan minimal **2 peserta** sudah berstatus **Lunas**
2. Buka menu **Ronde** di navigasi atas
3. Pilih turnamen yang ingin digenerate pairing-nya
4. Klik tombol **Generate Pairing**

Sistem akan:
- Mengelompokkan pemain berdasarkan skor
- Menghindari pasangan yang sudah pernah bertemu
- Memberikan warna (putih/hitam) secara bergantian
- Memberikan **bye** (1 poin gratis) jika jumlah peserta ganjil

5. Pairing ronde baru akan muncul di halaman

> **Catatan:** Ronde berikutnya hanya bisa digenerate jika ronde sebelumnya sudah selesai (semua hasil diinput).

---

## 6. Input Hasil Pertandingan

1. Buka menu **Ronde** → pilih turnamen
2. Cari ronde yang sedang **Berlangsung**
3. Di bagian bawah pairing, pilih hasil untuk setiap pertandingan:

| Pilihan | Artinya |
|---------|---------|
| `1 - 0` | Putih menang |
| `½ - ½` | Remis / draw |
| `0 - 1` | Hitam menang |

4. Setelah semua hasil dipilih, klik **Simpan Hasil**
5. Status ronde akan berubah menjadi **Selesai**

> **Bye:** Peserta yang mendapat bye otomatis mendapat 1 poin dan tidak perlu diinput hasilnya.

---

## 7. Lihat Klasemen

Klasemen bisa dilihat dari dua tempat:

### Admin
1. Buka halaman publik: `/klasemen/[kode-turnamen]`
   Contoh: `https://[domain]/klasemen/sumedang_open_2026`

### Publik
Peserta bisa melihat klasemen langsung dari link yang sama.

**Kolom klasemen:**

| Kolom | Artinya |
|-------|---------|
| # | Peringkat |
| Nama | Nama peserta |
| Poin | Total poin (Menang = 1, Remis = 0.5, Kalah = 0) |
| M | Jumlah menang |
| S | Jumlah seri |
| K | Jumlah kalah |
| BH | Buchholz (tie-breaker: total poin lawan) |

**Urutan:** Poin tertinggi → Buchholz tertinggi → Rating tertinggi

---

## Tips Admin

- **Sebelum membuka pendaftaran:** Pastikan status turnamen sudah **Pendaftaran Buka**
- **Verifikasi tepat waktu:** Cek pembayaran berkala agar peserta bisa masuk pairing
- **Pairing di akhir:** Generate pairing untuk ronde berikutnya hanya setelah semua hasil ronde sebelumnya diinput
- **Kode turnamen:** Gunakan format konsisten, contoh: `kabupaten_tahun`, `sekolah_2026`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Pastikan email dan password benar. Reset password via Supabase Dashboard jika perlu |
| Generate pairing error "Minimal 2 peserta" | Pastikan minimal 2 peserta sudah Lunas |
| Generate pairing error "Ronde sebelumnya belum selesai" | Input semua hasil ronde sebelumnya dulu |
| Peserta tidak muncul di klasemen | Cek apakah peserta sudah Lunas |
| Kode turnamen sudah digunakan | Gunakan kode yang berbeda (huruf kecil, angka, underscore) |
