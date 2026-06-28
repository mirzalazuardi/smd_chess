# Tasks: Sinkronisasi chess-results.com

## Fase 1: Modul Scraper (Import)

### 1.1 — Buat modul scraper HTML chess-results.com
**File:** `src/lib/sync/scraper.ts`
- [ ] Buat fungsi `fetchTournamentPage(tnrId: string, art: number): Promise<string>` — fetch HTML dari chess-results.com via server-side
- [ ] Buat fungsi `parseOverview(html: string): TournamentMeta` — parse metadata (nama, jumlah ronde, tanggal, lokasi)
- [ ] Buat fungsi `parsePlayerList(html: string): ChessResultsPlayer[]` — parse tabel pemain (nama, rating, klub/negara)
- [ ] Buat fungsi `parsePairings(html: string, roundNumber: number): ChessResultsPairing[]` — parse pairing per ronde (meja, putih, hitam, hasil)
- [ ] Buat fungsi `parseCrossTable(html: string): ChessResultsResult[]` — parse cross table untuk hasil per pemain per ronde
- [ ] Semua fungsi parse return typed objects, Zod-validated
- [ ] Defensive parsing: jika struktur HTML berubah, return error jelas, bukan crash
- [ ] **Test:** `tests/sync/scraper.test.ts` — test dengan sample HTML

### 1.2 — Buat skema Zod untuk data chess-results.com
**File:** `src/lib/validation/schemas.ts` (tambah section)
- [ ] `chessResultsPlayerSchema`: name, rating, club, federation
- [ ] `chessResultsPairingSchema`: round, table, white, black, whiteScore, blackScore
- [ ] `chessResultsMetaSchema`: name, rounds, date, location
- [ ] `importChessResultsSchema`: url (validasi format URL chess-results.com)

### 1.3 — Buat mapping layer chess-results.com → SMD Chess
**File:** `src/lib/sync/mapper.ts`
- [ ] Fungsi `mapPlayersToRegistrations(players, tournamentId)` — mapping pemain ke insert registrations
- [ ] Fungsi `mapPairingsToMatches(pairings, playerMap, roundId)` — mapping pairing ke insert matches
- [ ] Fungsi `detectExistingPlayers(newPlayers, existingRegistrations)` — deteksi duplikat berdasarkan nama (case-insensitive)
- [ ] **Test:** `tests/sync/mapper.test.ts`

### 1.4 — Buat endpoint import POST /api/sync/import/chess-results
**File:** `src/app/api/sync/import/chess-results/route.ts`
- [ ] Admin-guarded (requireAdmin)
- [ ] Terima `{ url: string, tournamentId: string }` — URL chess-results.com + ID turnamen target di SMD Chess
- [ ] Step 1: Scrape overview → validasi turnamen masih dalam scope (draft/open)
- [ ] Step 2: Scrape player list → mapping ke registrations
- [ ] Step 3: Deteksi duplikat vs existing registrations
- [ ] Step 4: Scrape pairings per ronde → insert rounds + matches
- [ ] Step 5: Scrape cross table → update match scores
- [ ] Response: `{ imported: { players, rounds, matches }, skipped: { players, reason[] } }`
- [ ] Error handling: jika gagal scrape, return error spesifik (network error / parse error)
- [ ] **Test:** `tests/api/sync-import.test.ts` — mock fetch, test flow

### 1.5 — Buat endpoint preview GET /api/sync/preview/chess-results
**File:** `src/app/api/sync/preview/chess-results/route.ts`
- [ ] Admin-guarded
- [ ] Query: `?url=https://chess-results.com/tnr123456.aspx`
- [ ] Scrape overview + player count → return preview data tanpa insert
- [ ] Response: `{ tournamentName, roundCount, playerCount, firstRoundPairings }`

## Fase 2: Modul Export

### 2.1 — Buat modul TRF export
**File:** `src/lib/sync/trf-export.ts`
- [ ] Fungsi `generateTRF(tournament, registrations, rounds): string` — generate TRF16 format
- [ ] Header section: tournament name, city, federation, start/end date, arbiter
- [ ] Player section (XXR): rating, title, name, federation
- [ ] Round section (001-999): pairing table + result codes (1=white win, 0=black win, ==draw)
- [ ] Validasi format sesuai spesifikasi FIDE C04 Annex 2
- [ ] **Test:** `tests/sync/trf-export.test.ts` — bandingkan output dengan contoh TRF valid

### 2.2 — Buat modul CSV export
**File:** `src/lib/sync/csv-export.ts`
- [ ] Fungsi `generatePlayerCSV(registrations): string` — export daftar pemain format CSV
- [ ] Fungsi `generatePairingCSV(rounds): string` — export pairing + hasil format CSV
- [ ] Fungsi `generateStandingsCSV(standings): string` — export klasemen format CSV
- [ ] Header dalam Bahasa Indonesia
- [ ] **Test:** `tests/sync/csv-export.test.ts`

### 2.3 — Buat endpoint export TRF
**File:** `src/app/api/tournaments/[id]/export/trf/route.ts`
- [ ] Admin-guarded
- [ ] GET → query tournament + registrations + rounds → generate TRF → return as text file download
- [ ] Content-Type: `text/plain; charset=utf-8`
- [ ] Content-Disposition: `attachment; filename="{code}.trf"`

### 2.4 — Buat endpoint export CSV
**File:** `src/app/api/tournaments/[id]/export/csv/route.ts`
- [ ] Admin-guarded
- [ ] GET + query `?type=players|pairings|standings` → generate CSV → return as file download
- [ ] Content-Type: `text/csv; charset=utf-8`
- [ ] Content-Disposition: `attachment; filename="{code}-{type}.csv"`

## Fase 3: UI

### 3.1 — Buat halaman admin /admin/sync
**File:** `src/app/admin/sync/page.tsx`
- [ ] Form input URL chess-results.com + pilih turnamen target
- [ ] Tombol "Pratinjau" → panggil preview endpoint → tampilkan metadata + jumlah pemain
- [ ] Tombol "Impor" → panggil import endpoint → tampilkan hasil (imported/skipped)
- [ ] Loading state, error state, success state
- [ ] Client component (`"use client"`)

### 3.2 — Tambah tombol export di halaman turnamen
**File:** `src/app/admin/turnamen/[id]/edit/page.tsx` (edit existing)
- [ ] Tombol "Export TRF" → download file TRF
- [ ] Tombol "Export CSV Pemain" → download CSV player list
- [ ] Hanya tampil jika turnamen punya peserta

### 3.3 — Tambah link sync di admin dashboard
**File:** `src/app/admin/page.tsx` (edit existing)
- [ ] Tambah card "Sinkronisasi chess-results.com" dengan link ke `/admin/sync`

## Fase 4: Dokumentasi & Finalisasi

### 4.1 — Update project spec
- [ ] Tambah modul `src/lib/sync/` ke `openspec/project.md`
- [ ] Tambah endpoint sync ke tabel API routes
- [ ] Catat constraint chess-results.com scraping

### 4.2 — Integration test manual
- [ ] Test import dengan URL turnamen nyata dari chess-results.com
- [ ] Test TRF export dibuka di Swiss-Manager (jika ada akses)
- [ ] Test CSV import kembali ke SMD Chess (roundtrip)

---

## Ringkasan File Baru

```
src/
├── lib/
│   └── sync/
│       ├── scraper.ts           # HTML scraper chess-results.com
│       ├── mapper.ts            # Mapping ke SMD Chess schema
│       ├── trf-export.ts        # TRF format generator
│       └── csv-export.ts        # CSV export
├── app/
│   ├── api/
│   │   ├── sync/
│   │   │   ├── import/
│   │   │   │   └── chess-results/
│   │   │   │       └── route.ts   # POST import
│   │   │   └── preview/
│   │   │       └── chess-results/
│   │   │           └── route.ts   # GET preview
│   │   └── tournaments/
│   │       └── [id]/
│   │           └── export/
│   │               ├── trf/
│   │               │   └── route.ts  # GET TRF export
│   │               └── csv/
│   │                   └── route.ts  # GET CSV export
│   └── admin/
│       └── sync/
│           └── page.tsx             # Admin sync page
tests/
└── sync/
    ├── scraper.test.ts
    ├── mapper.test.ts
    ├── trf-export.test.ts
    └── csv-export.test.ts
```
