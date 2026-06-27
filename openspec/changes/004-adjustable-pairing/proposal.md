# Proposal: Adjustable Pairing

## Problem

Swiss pairing saat ini di-generate otomatis dan tidak bisa diubah. Wasit sering perlu menyesuaikan pasangan secara manual — misalnya peserta tidak hadir, ada permintaan khusus, atau wasit ingin memperbaiki keseimbangan warna. Tanpa kemampuan edit, satu-satunya jalan adalah menghapus ronde dan generate ulang, yang berisiko menghilangkan data.

## Solution

Beri wasit kemampuan mengubah pasangan sebuah ronde **sebelum ada hasil yang diinput**, dengan tingkat kebebasan yang berbeda:

- **Ronde 1 (belum ada skor):** bebas penuh — tukar lawan, tukar warna (putih/hitam), atur ulang nomor meja, dan tentukan siapa yang bye.
- **Ronde 2 sampai akhir:** bisa diubah, tetapi tetap mengikuti aturan Swiss. Sistem **memblokir** perubahan yang melanggar aturan keras dan **memberi peringatan** untuk pelanggaran lunak yang masih boleh di-override wasit.

**Aturan keras (blokir simpan):**
- Rematch — dua pemain yang sudah pernah bertanding tidak boleh dipasangkan lagi.
- Bye ganda — pemain yang sudah pernah bye tidak boleh bye lagi.
- Permutasi tidak sah — susunan baru harus memakai persis kumpulan pemain yang sama.

**Aturan lunak (peringatan, tetap boleh disimpan):**
- Warna sama dua ronde berturut-turut.
- Selisih skor antar pemain terlalu jauh (lintas kelompok skor).

## Scope

- Modul validasi murni `src/lib/swiss/validation.ts` (dipakai server dan client).
- Ekstraksi riwayat pemain ke `src/lib/swiss/history.ts`, dipakai ulang oleh generate-pairing yang sudah ada.
- Endpoint baru `PATCH /api/rounds/[id]/pairings` untuk menyimpan susunan baru.
- Komponen editor `src/components/ui/pairing-editor.tsx` dengan interaksi klik-untuk-tukar, toggle warna, pemilih bye, dan atur meja.
- Integrasi ke halaman admin `src/app/admin/ronde/[tournament_id]/page.tsx`.

## Out of Scope

- Mengedit pasangan setelah ada hasil yang diinput (harus hapus hasil dulu).
- Drag-and-drop (klik-untuk-tukar dulu; drag bisa jadi enhancement berikutnya).
- Mengubah daftar peserta (paid filter) dari layar pairing.
- Re-generate otomatis sebagian (partial re-pair) — wasit menyusun manual.

## Success Criteria

1. Pada ronde 1 tanpa hasil, wasit bisa menukar lawan, warna, meja, dan bye, lalu menyimpan.
2. Pada ronde 2+, mencoba membuat rematch atau bye ganda memblokir simpan dengan pesan jelas.
3. Pelanggaran warna/selisih skor muncul sebagai peringatan tetapi tetap bisa disimpan.
4. Ronde yang sudah punya hasil tidak bisa diedit pasangannya (tombol edit tidak muncul / endpoint menolak).
5. `paid = TRUE` filter tetap dihormati — tidak ada pemain non-lunas yang bisa masuk pairing.
6. Semua test unit lulus (`npm test`), termasuk test baru untuk validasi.
