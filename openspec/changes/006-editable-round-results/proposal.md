# Proposal: Editable Round Results

## Problem

Setelah admin menyimpan hasil pertandingan via `ResultInputForm`, ronde berubah status menjadi `"completed"` dan form input hasil hilang. Admin tidak bisa mengoreksi kesalahan input skor **sebelum** generate pairing ronde berikutnya. Satu-satunya cara saat ini adalah hapus manual dari database.

## Solution

Izinkan admin mengedit hasil ronde terakhir (sebelum ronde berikutnya digenerate) melalui:

1. Tombol **"Edit Hasil"** pada ronde `"completed"` yang merupakan ronde terakhir
2. Klik tombol → `ResultInputForm` muncul dengan nilai yang sudah tersimpan
3. API guard: tolak edit jika ronde berikutnya sudah ada (409 Conflict)

Setelah ronde berikutnya digenerate, hasil ronde sebelumnya terkunci permanen.

## Scope

- **3 file berubah**, tidak ada migrasi database
- MID tier (multi-file, scope jelas, atomic)
- Tidak mengubah flow generate pairing yang sudah ada
- Tidak mengubah schema, `buildPlayerHistory`, atau kalkulasi skor
