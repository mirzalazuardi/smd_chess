# Proposal: Table Number for Match Pairings

## Problem

Wasit dan peserta tidak bisa dengan mudah mengetahui meja mana untuk setiap pertandingan. Saat ini pairing ditampilkan tanpa nomor meja, menyulitkan koordinasi di venue turnamen.

## Solution

Tambahkan kolom `table_no` pada setiap match. Meja 1 = pemain dengan skor tertinggi, meja terakhir = skor terendah. Bye tidak memerlukan meja.

## Scope

- Add `table_no` column to `matches` table
- Assign table numbers during pairing generation
- Display in admin rounds page (`/admin/ronde/[tournament_id]`)
- New public TV-optimized page (`/pairing/[code]/[round]`)
- Day/night theme toggle for TV display

## Out of Scope

- Pagination untuk > 50 meja (future enhancement)
- Auto-rotate/slideshow mode
- QR code untuk peserta scan

## Success Criteria

1. Setiap match memiliki `table_no` yang assigned saat generate pairing
2. Meja 1 selalu berisi pemain dengan skor tertinggi di ronde tersebut
3. Admin dan public page menampilkan nomor meja
4. Public page fit di TV tanpa scroll (max 50 meja)
5. Theme toggle berfungsi dengan kontras yang baik
