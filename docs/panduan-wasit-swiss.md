# Panduan Wasit — Sistem Swiss Pairing

Dokumentasi teknis algoritma Swiss pairing yang digunakan SMD Chess untuk verifikasi dan validasi oleh wasit/arbiter turnamen.

---

## Daftar Isi

1. [Apa itu Swiss System?](#1-apa-itu-swiss-system)
2. [Prinsip Dasar Swiss Pairing](#2-prinsip-dasar-swiss-pairing)
3. [Algoritma yang Digunakan](#3-algoritma-yang-digunakan)
4. [Penentuan Warna (Putih/Hitam)](#4-penentuan-warna-putihhitam)
5. [Bye (Peserta Ganjil)](#5-bye-peserta-ganjil)
6. [Float Down (Turun Kelompok)](#6-float-down-turun-kelompok)
7. [Sistem Tie-Break](#7-sistem-tie-break)
8. [Checklist Verifikasi Wasit](#8-checklist-verifikasi-wasit)

---

## 1. Apa itu Swiss System?

**Swiss System** adalah metode pairing turnamen catur yang memungkinkan banyak peserta bertanding dalam jumlah ronde terbatas, tanpa sistem gugur.

**Karakteristik utama:**
- Semua peserta bermain di setiap ronde (tidak ada eliminasi)
- Pemain dengan skor yang sama dipertemukan
- Tidak ada pengulangan lawan yang sudah pernah bertemu
- Jumlah ronde jauh lebih sedikit dari jumlah peserta

**Rumus jumlah ronde yang direkomendasikan:**
```
Ronde = log₂(Peserta) + 1

Contoh:
- 16 peserta → 5 ronde
- 32 peserta → 6 ronde
- 64 peserta → 7 ronde
- 100 peserta → 8 ronde
```

---

## 2. Prinsip Dasar Swiss Pairing

### 2.1 Urutan Prioritas Pairing

1. **Kelompok Skor** — Pemain dikelompokkan berdasarkan total poin
2. **Urutan dalam Kelompok** — Diurutkan berdasarkan rating tertinggi
3. **Hindari Pengulangan** — Tidak mempertemukan lawan yang sudah pernah bertemu
4. **Warna Bergantian** — Setiap pemain mendapat warna putih/hitam secara bergantian

### 2.2 Ilustrasi Ronde 1

| # | Nama | Rating | Skor |
|---|------|--------|------|
| 1 | Andi | 1800 | 0 |
| 2 | Budi | 1750 | 0 |
| 3 | Citra | 1700 | 0 |
| 4 | Dina | 1650 | 0 |
| 5 | Eko | 1600 | 0 |
| 6 | Fani | 1550 | 0 |

**Hasil Pairing Ronde 1:**
- Meja 1: Andi (Putih) vs Budi (Hitam)
- Meja 2: Citra (Putih) vs Dina (Hitam)
- Meja 3: Eko (Putih) vs Fani (Hitam)

> Rating tertinggi mendapat warna putih di ronde pertama.

---

## 3. Algoritma yang Digunakan

SMD Chess menggunakan algoritma Swiss pairing dengan langkah-langkah berikut:

### 3.1 Sorting Pemain

```
1. Urutkan berdasarkan SKOR (tertinggi di atas)
2. Jika skor sama, urutkan berdasarkan RATING (tertinggi di atas)
```

### 3.2 Pengelompokan berdasarkan Skor

```
Contoh setelah Ronde 2:

Kelompok 2 poin: [Andi, Budi]
Kelompok 1.5 poin: [Citra]
Kelompok 1 poin: [Dina, Eko]
Kelompok 0.5 poin: [Fani]
```

### 3.3 Pairing dalam Kelompok

Untuk setiap kelompok:

1. Ambil pemain pertama (P1)
2. Cari lawan (P2) yang:
   - Belum pernah bertemu dengan P1
   - Belum dipasangkan di ronde ini
3. Jika tidak ada lawan yang valid, pasangkan dengan lawan pertama yang tersedia (fallback)
4. Tentukan warna berdasarkan riwayat warna terakhir

### 3.4 Contoh Kasus Khusus

**Situasi:** Andi (2 poin) sudah pernah bertemu Budi (2 poin)

**Solusi:**
- Jika masih ada pemain lain di kelompok 2 poin → pasangkan dengan pemain lain
- Jika tidak ada → salah satu di-*float down* ke kelompok 1.5 poin

---

## 4. Penentuan Warna (Putih/Hitam)

### 4.1 Aturan Prioritas Warna

| Prioritas | Kondisi | Aksi |
|-----------|---------|------|
| 1 | P1 terakhir Putih, P2 bukan Putih | P2 dapat Putih |
| 2 | P2 terakhir Putih, P1 bukan Putih | P1 dapat Putih |
| 3 | P1 terakhir Hitam, P2 bukan Hitam | P1 dapat Putih |
| 4 | P2 terakhir Hitam, P1 bukan Hitam | P2 dapat Putih |
| 5 | Tidak ada preferensi | Rating tertinggi dapat Putih |

### 4.2 Contoh Penerapan

```
Andi: terakhir Putih
Budi: terakhir Hitam

→ Budi dapat Putih (bergantian)
→ Hasil: Budi (Putih) vs Andi (Hitam)
```

### 4.3 Ronde Pertama

Di ronde pertama (semua belum punya riwayat warna):
- Rating tertinggi mendapat **Putih**

---

## 5. Bye (Peserta Ganjil)

### 5.1 Definisi

**Bye** adalah kondisi di mana seorang pemain tidak bertanding pada ronde tertentu karena jumlah peserta ganjil.

### 5.2 Aturan Bye

| Aturan | Keterangan |
|--------|------------|
| Poin | Pemain yang mendapat bye mendapat **1 poin** (menang tanpa main) |
| Prioritas | Pemain dengan skor terendah di kelompok terakhir |
| Batasan | Setiap pemain **hanya boleh bye 1 kali** sepanjang turnamen |

### 5.3 Contoh

```
7 peserta di turnamen

Ronde 1 pairing:
- Meja 1: A vs B
- Meja 2: C vs D
- Meja 3: E vs F
- Bye: G (dapat 1 poin)

Ronde 2: G tidak bisa bye lagi
```

---

## 6. Float Down (Turun Kelompok)

### 6.1 Definisi

**Float Down** terjadi ketika pemain tidak bisa dipasangkan dalam kelompok skornya dan diturunkan ke kelompok skor di bawahnya.

### 6.2 Batasan Float

SMD Chess membatasi float down maksimal **2 kali** per pemain sepanjang turnamen.

Konfigurasi: `SWISS_MAX_FLOAT_DOWN` (default: 2)

### 6.3 Contoh

```
Kelompok 3 poin: [Andi] ← hanya 1 pemain, ganjil
Kelompok 2 poin: [Budi, Citra, Dina]

Andi di-float down ke kelompok 2 poin:
Kelompok 2 poin: [Budi, Citra, Dina, Andi]

Pairing:
- Budi vs Andi (Andi float down)
- Citra vs Dina
```

---

## 7. Sistem Tie-Break

### 7.1 Urutan Tie-Break

Jika dua atau lebih pemain memiliki skor yang sama, peringkat ditentukan berdasarkan:

| Prioritas | Kriteria | Keterangan |
|-----------|----------|------------|
| 1 | **Skor** | Total poin (Menang=1, Seri=0.5, Kalah=0) |
| 2 | **Buchholz** | Jumlah total poin semua lawan yang pernah dihadapi |
| 3 | **Rating** | Rating catur awal peserta |

### 7.2 Cara Hitung Buchholz

```
Buchholz = Σ(Skor lawan yang pernah dihadapi)

Contoh:
Andi melawan: Budi (3 poin), Citra (2 poin), Dina (1.5 poin)
Buchholz Andi = 3 + 2 + 1.5 = 6.5
```

### 7.3 Contoh Penerapan

| Nama | Skor | Buchholz | Rating | Peringkat |
|------|------|----------|--------|-----------|
| Andi | 5 | 12.5 | 1800 | 1 |
| Budi | 5 | 11.0 | 1850 | 2 |
| Citra | 5 | 11.0 | 1700 | 3 |

> Andi dan Budi sama-sama 5 poin, tapi Buchholz Andi lebih tinggi → Andi peringkat 1.
> Budi dan Citra sama Buchholz, tapi rating Budi lebih tinggi → Budi peringkat 2.

---

## 8. Checklist Verifikasi Wasit

Gunakan checklist ini untuk memverifikasi bahwa pairing sudah benar.

### 8.1 Sebelum Generate Pairing

- [ ] Jumlah peserta **Lunas** sudah benar
- [ ] Tidak ada peserta yang salah status pembayaran
- [ ] Semua hasil ronde sebelumnya sudah diinput
- [ ] Tidak ada hasil yang salah input (cek dengan wasit lapangan)

### 8.2 Setelah Generate Pairing

- [ ] **Tidak ada pengulangan lawan**
  - Cek setiap pasangan: apakah mereka sudah pernah bertemu di ronde sebelumnya?

- [ ] **Kelompok skor benar**
  - Pemain dengan skor tinggi bertemu pemain dengan skor tinggi
  - Pemain dengan skor rendah bertemu pemain dengan skor rendah

- [ ] **Warna bergantian**
  - Cek pemain yang sudah main 2+ ronde: apakah warnanya bergantian?
  - Toleransi: maksimal 2 kali warna sama berturut-turut dalam kasus darurat

- [ ] **Bye benar** (jika ada)
  - Hanya 1 pemain yang bye per ronde
  - Pemain tersebut belum pernah bye sebelumnya
  - Pemain tersebut dari kelompok skor terendah

### 8.3 Setelah Ronde Selesai

- [ ] Semua hasil sudah diinput
- [ ] Tidak ada pertandingan dengan hasil kosong
- [ ] Hasil sesuai dengan formulir manual wasit lapangan
- [ ] Klasemen sudah terupdate otomatis

### 8.4 Format Verifikasi Manual

```
VERIFIKASI PAIRING RONDE [X]
Turnamen: [Nama Turnamen]
Tanggal: [DD/MM/YYYY]
Wasit: [Nama Wasit]

Total Peserta: ___
Peserta Aktif (Lunas): ___
Jumlah Meja: ___
Bye: Ya / Tidak

□ Tidak ada pengulangan lawan
□ Kelompok skor sesuai
□ Warna bergantian
□ Bye valid (jika ada)

Catatan:
_________________________
_________________________

Tanda Tangan Wasit: ___________
```

---

## Referensi

- FIDE Swiss Rules: [handbook.fide.com](https://handbook.fide.com)
- Implementasi: `src/lib/swiss/pairing.ts`
- Test cases: `tests/swiss/pairing.test.ts`
