# Tasks: Adjustable Pairing

Setiap task atomik: satu berkas, satu tujuan, bisa diverifikasi sendiri. Urutan menjaga dependensi.

## Phase 1: Types

- [ ] **1.1** Di `src/lib/swiss/types.ts`, tambahkan tipe `ViolationCode` (union: `"rematch" | "repeat_bye" | "invalid_permutation" | "color_repeat" | "score_gap"`).
  - Acceptance: `npx tsc --noEmit` lulus.
- [ ] **1.2** Di `src/lib/swiss/types.ts`, tambahkan interface `Violation` (`code`, `severity: "error" | "warning"`, `message: string`, `tableNo: number | null`, `playerIds: string[]`).
- [ ] **1.3** Di `src/lib/swiss/types.ts`, tambahkan interface `PairingValidationResult` (`ok: boolean`, `errors: Violation[]`, `warnings: Violation[]`).

## Phase 2: Validation logic (TDD — test dulu)

- [ ] **2.1** Buat `tests/swiss/validation.test.ts`. Tulis test gagal: `validatePairings` mengembalikan error `invalid_permutation` saat set pemain tidak cocok dengan `expectedPlayerIds`.
- [ ] **2.2** Buat `src/lib/swiss/validation.ts` dengan signature `validatePairings(pairings, options)` per spec REQ-1..6. Implement REQ-1 (permutasi) hingga test 2.1 hijau.
- [ ] **2.3** Tambah test: rematch terdeteksi sebagai `error` saat `!firstRound` dan `white.opponentIds` memuat `black.id`. Implement REQ-2 hingga hijau.
- [ ] **2.4** Tambah test: bye untuk pemain dengan `hadBye === true` → `error repeat_bye` (non-first-round). Tambah test: dua bye dalam satu ronde → error. Implement REQ-3 hingga hijau.
- [ ] **2.5** Tambah test: `white.lastColor === "W"` → `warning color_repeat`; `black.lastColor === "B"` → `warning`. Implement REQ-4 hingga hijau.
- [ ] **2.6** Tambah test: selisih skor `> scoreGapThreshold` (default 1.0) → `warning score_gap`. Implement REQ-5 hingga hijau.
- [ ] **2.7** Tambah test: saat `firstRound === true`, hanya REQ-1 dievaluasi (rematch/bye/warna/skor dilewati). Implement REQ-6 hingga hijau.
- [ ] **2.8** Tambah test: `result.ok === false` jika ada `severity === "error"`, dan `true` jika hanya warnings. Pastikan `errors`/`warnings` terpisah benar.

## Phase 3: Player history extraction (refactor, perilaku tetap)

- [ ] **3.1** Buat `src/lib/swiss/history.ts` dengan `buildPlayerHistory(registrations, priorRounds): Map<string, Player>` per spec REQ-7. Pindahkan logika akumulasi skor/opponentIds/lastColor/hadBye dari `POST /api/tournaments/[id]/rounds`.
- [ ] **3.2** Buat `tests/swiss/history.test.ts`: verifikasi skor, opponentIds, lastColor, hadBye terhitung benar dari priorRounds contoh.
- [ ] **3.3** Refactor `src/app/api/tournaments/[id]/rounds/route.ts` agar memakai `buildPlayerHistory`. Jangan ubah perilaku/respons.
  - Acceptance: semua test lama tetap lulus (`npm test`).

## Phase 4: API endpoint

- [ ] **4.1** Buat `src/app/api/rounds/[id]/pairings/route.ts` dengan handler `PATCH`. Tambah guard `requireAdmin()` dan kembalikan `errorResponse` jika gagal.
- [ ] **4.2** Tambah skema Zod untuk body `{ matches: { table_no, player1_id, player2_id }[] }`; balas 400 jika tidak valid.
- [ ] **4.3** Muat ronde + matches. Balas 404 jika ronde tidak ada; 409 jika `status === 'completed'` atau ada match dengan skor terisi (per REQ-8).
- [ ] **4.4** Muat registrations `paid = true` & `is_active = true`; bangun history via `buildPlayerHistory`. (Filter `paid` WAJIB.)
- [ ] **4.5** Susun `Pairing[]` dari body, set `firstRound = round_number === 1`, jalankan `validatePairings`. Jika `!ok` balas 400 `{ error, violations }`.
- [ ] **4.6** Persist: hapus matches lama ronde, insert ulang dari arrangement (bye → `status "completed", player1_score 1`; lainnya → `status "pending"`, skor null). Balas 200 `{ round, matches, warnings }`.

## Phase 5: UI component

- [ ] **5.1** Buat `src/components/ui/pairing-editor.tsx` (`"use client"`) dengan props per spec REQ-10 dan state mode tampil/edit + tombol "Atur Pairing".
- [ ] **5.2** Implement klik-untuk-tukar: klik pemain pertama menyorot, klik kedua menukar posisi keduanya di state lokal.
- [ ] **5.3** Implement toggle warna per meja (tukar putih↔hitam) dan pemilih bye untuk jumlah ganjil.
- [ ] **5.4** Implement atur `table_no` (naik/turun).
- [ ] **5.5** Jalankan `validatePairings` (impor langsung) tiap perubahan; tampilkan badge warning dan blokir tombol "Simpan" jika ada error.
- [ ] **5.6** Implement "Simpan" → `PATCH /api/rounds/[id]/pairings`; pada sukses `router.refresh()`, pada error tampilkan pesan.

## Phase 6: Admin integration

- [ ] **6.1** Di `src/app/admin/ronde/[tournament_id]/page.tsx`, hitung `isEditable` per ronde (status != completed && belum ada hasil) dan render `PairingEditor` untuk ronde editable.
- [ ] **6.2** Pastikan ronde dengan hasil tetap memakai tampilan + `ResultInputForm` yang ada (editor tidak muncul).

## Phase 7: Verification

- [ ] **7.1** Jalankan `npm test` — semua lulus (lama + baru).
- [ ] **7.2** Jalankan `npx tsc --noEmit` — tanpa error tipe.
- [ ] **7.3** Manual: ronde 1, tukar lawan & warna & bye, simpan — tersimpan benar.
- [ ] **7.4** Manual: ronde 2, coba buat rematch — simpan terblokir dengan pesan.
- [ ] **7.5** Manual: ronde 2, buat warna berulang — peringatan muncul tetapi simpan berhasil.
- [ ] **7.6** Manual: ronde dengan hasil — editor tidak muncul / endpoint balas 409.

## Phase 8: Documentation

- [ ] **8.1** Update `openspec/project.md` jika perlu (tidak ada perubahan skema; catat endpoint baru `PATCH /api/rounds/[id]/pairings` bila ada daftar endpoint).
- [ ] **8.2** Update `docs/panduan-wasit-swiss.md` — tambah bagian cara menyesuaikan pairing manual.
