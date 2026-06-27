# Spec: Adjustable Pairing

## Concepts

- **Editable round** — sebuah `tournament_rounds` yang `status != 'completed'` DAN tidak punya satu pun `matches` dengan `player1_score`/`player2_score` terisi (belum ada hasil).
- **First round** — `round_number === 1`. Tidak punya riwayat, jadi semua aturan berbasis-riwayat dilewati (bebas penuh).
- **Player history** — agregasi dari ronde-ronde sebelumnya: skor, daftar lawan (`opponentIds`), warna terakhir (`lastColor`), dan status bye (`hadBye`). Memakai tipe `Player` yang sudah ada di `src/lib/swiss/types.ts`.
- **Arrangement** — daftar pasangan baru untuk satu ronde: array `{ table_no, player1_id (putih), player2_id (hitam, null = bye) }`.

## Violation Model

Tambahan tipe di `src/lib/swiss/types.ts`:

```ts
export type ViolationCode =
  | "rematch"           // error
  | "repeat_bye"        // error
  | "invalid_permutation" // error
  | "color_repeat"      // warning
  | "score_gap";        // warning

export interface Violation {
  code: ViolationCode;
  severity: "error" | "warning";
  message: string;            // Bahasa Indonesia, siap tampil
  tableNo: number | null;
  playerIds: string[];
}

export interface PairingValidationResult {
  ok: boolean;                // false jika ada severity === "error"
  errors: Violation[];
  warnings: Violation[];
}
```

## Validation Rules

Fungsi murni `validatePairings(pairings: Pairing[], options: { firstRound: boolean; expectedPlayerIds: string[]; scoreGapThreshold?: number }): PairingValidationResult` di `src/lib/swiss/validation.ts`.

`scoreGapThreshold` default `1.0`.

### REQ-1: Permutasi sah (error)
Kumpulan id pemain pada `pairings` (putih + hitam, abaikan null) HARUS sama persis dengan `expectedPlayerIds` (tanpa duplikat, tanpa hilang). Jika tidak → satu `Violation { code: "invalid_permutation", severity: "error" }`.

### REQ-2: No rematch (error, hanya non-first-round)
Untuk tiap pasangan dengan `black != null`, jika `!firstRound` dan `white.opponentIds` memuat `black.id` → `Violation { code: "rematch", severity: "error", tableNo, playerIds: [white.id, black.id] }`.

### REQ-3: No repeat bye (error, hanya non-first-round)
Untuk pasangan bye (`black === null`), jika `!firstRound` dan `white.hadBye === true` → `Violation { code: "repeat_bye", severity: "error" }`. Jika ada lebih dari satu bye dalam satu ronde → tiap bye ekstra adalah `Violation { code: "repeat_bye", severity: "error" }` (maksimal satu bye per ronde).

### REQ-4: Color repeat (warning, hanya non-first-round)
Untuk pasangan dengan `black != null`: jika `white.lastColor === "W"` → warning (putih dua kali). Jika `black.lastColor === "B"` → warning (hitam dua kali). `Violation { code: "color_repeat", severity: "warning" }`.

### REQ-5: Score gap (warning, hanya non-first-round)
Untuk pasangan dengan `black != null`: jika `Math.abs(white.score - black.score) > scoreGapThreshold` → `Violation { code: "score_gap", severity: "warning" }`.

### REQ-6: First round bebas
Jika `firstRound === true`, hanya REQ-1 (permutasi) yang dievaluasi. REQ-2..5 dilewati seluruhnya.

## Player History Extraction

### REQ-7: Modul `history.ts`
Fungsi `buildPlayerHistory(registrations, priorRounds): Map<string, Player>` di `src/lib/swiss/history.ts`. Logikanya identik dengan akumulasi yang saat ini inline di `POST /api/tournaments/[id]/rounds` (skor, opponentIds, lastColor, hadBye dari semua match yang sudah punya skor). Endpoint POST yang ada DI-REFACTOR untuk memakai fungsi ini (tanpa mengubah perilakunya).

## API

### REQ-8: `PATCH /api/rounds/[id]/pairings`
- Guard `requireAdmin()`; jika gagal → 401/403 (pakai `errorResponse` yang ada).
- Validasi body dengan Zod: `{ matches: { table_no: number | null, player1_id: string, player2_id: string | null }[] }`.
- Muat ronde + match-nya. Jika ronde tidak ada → 404.
- Jika ronde sudah punya hasil (ada match dengan skor terisi) atau `status === 'completed'` → 409 `{ error: "Ronde sudah punya hasil, tidak bisa diubah" }`.
- Bangun `Player` history via `buildPlayerHistory` (peserta = registrations `paid = true` & `is_active = true` pada turnamen ini — `paid` filter WAJIB).
- `firstRound = round_number === 1`. Susun `Pairing[]` dari body memakai objek Player dari history.
- Jalankan `validatePairings`. Jika `!ok` → 400 `{ error, violations }` (hanya errors yang memblokir; warnings tidak memblokir).
- Persist: hapus semua `matches` ronde tsb, insert ulang dari arrangement (bentuk insert mengikuti `POST .../rounds`: bye → `status: "completed", player1_score: 1`; non-bye → `status: "pending"`, skor null).
- Respons 200 `{ round, matches, warnings }`.

### REQ-9: Pelestarian invariant
Endpoint tidak boleh memasukkan id pemain di luar set peserta lunas. Jika body memuat id asing, REQ-1 (permutasi) akan menangkapnya sebagai error sebelum persist.

## UI

### REQ-10: Komponen `pairing-editor.tsx` (client)
Props: `roundId`, `roundNumber`, `matches` (dengan nama), `players` (kandidat). Perilaku:
- Mode tampil → tombol "Atur Pairing" untuk masuk mode edit.
- **Tukar lawan:** klik satu pemain (highlight), klik pemain lain → keduanya bertukar tempat. Validasi dijalankan ulang (impor `validatePairings` langsung — modul murni).
- **Tukar warna:** tombol per meja menukar putih↔hitam.
- **Bye:** pemilih untuk menetapkan pemain ke slot bye (saat jumlah ganjil).
- **Atur meja:** naik/turun untuk mengubah `table_no`.
- Badge peringatan inline (warna/selisih skor); pesan error memblokir tombol "Simpan".
- "Simpan" → `PATCH /api/rounds/[id]/pairings`, lalu `router.refresh()`.

### REQ-11: Integrasi halaman admin
Di `src/app/admin/ronde/[tournament_id]/page.tsx`, tampilkan `PairingEditor` untuk ronde yang *editable*. Untuk ronde yang sudah punya hasil, sembunyikan editor (tetap pakai tampilan + `ResultInputForm` yang ada).

## Out of Scope (spec)

- Perubahan skema database (tidak ada kolom baru — `matches` sudah cukup).
- Drag-and-drop.
- Edit setelah hasil masuk.
