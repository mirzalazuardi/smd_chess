# Proposal: Fix Root Path & Multi-Tournament Registration

## Problem

1. Links `/jadwal` dan `/klasemen` di home page, admin dashboard, dan halaman sukses broken — routes butuh parameter `[code]` tapi link tidak menyertakan kode turnamen
2. `/daftar` tidak punya direkt link per turnamen (`/daftar/[code]`) — menyulitkan kalau ada poster/QR code untuk turnamen spesifik

## Solution

Buat halaman indeks di `/jadwal` dan `/klasemen` yang menampilkan daftar turnamen sebelum user masuk ke detail. Tambah route `/daftar/[code]` untuk registrasi langsung ke turnamen spesifik.

## Scope

- Create 4 new files (3 pages + 1 shared component)
- No changes to existing files (links auto-resolve to new index pages)
- Shared `TournamentIndex` server component for `/jadwal` and `/klasemen` index pages
- Direct registration at `/daftar/[code]` with tournament pre-selected

## Out of Scope

- Redesign form pendaftaran
- QR code generation
- Tournament detail page
- Pagination untuk index (future)

## Success Criteria

1. Klik "Lihat Jadwal" dari home page → halaman daftar turnamen → klik → `/jadwal/[code]`
2. Klik "Klasemen" dari home page → halaman daftar turnamen → klik → `/klasemen/[code]`
3. Klik "Lihat Jadwal" dari admin dashboard → halaman daftar turnamen
4. Akses `/daftar/[code]` → form registrasi dengan turnamen pre-selected, tanpa dropdown
5. Akses `/daftar/[code]` dengan kode tidak valid → 404
6. Akses `/daftar/[code]` dengan turnamen tidak `open` → 404
7. `/daftar` tetap berfungsi dengan dropdown (fallback)
