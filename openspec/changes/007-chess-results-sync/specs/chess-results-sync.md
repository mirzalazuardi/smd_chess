# Spec: Sinkronisasi chess-results.com

## Overview

Modul `src/lib/sync/` menyediakan kemampuan import data dari chess-results.com (via HTML scraping) dan export data SMD Chess ke format standar (TRF, CSV) untuk interoperabilitas dengan Swiss-Manager.

## chess-results.com Scraping

### URL Structure

chess-results.com menggunakan parameter `art` untuk membedakan halaman:

| art | Halaman | Data yang di-scrape |
|-----|---------|-------------------|
| 0 | Overview | Nama turnamen, federasi, tanggal, jumlah ronde, arbiter |
| 1 | Player list | Tabel: No, Nama, FED, Rating, Klub |
| 2 | Pairings per round | Tabel: Meja, Putih, Hitam, Hasil (per ronde, parameter `rd=`) |
| 4 | Cross table | Matriks: pemain × ronde = hasil + lawan |

URL dasar: `https://chess-results.com/tnr{ID}.aspx?lan=18&art={ART}`

Parameter opsional:
- `lan=18` — Bahasa Indonesia (teks header: "Papan", "Pt", "Hitam", "Hasil")
- `rd=1` — Ronde ke-N (untuk art=2)
- `zeilen=99999` — Tampilkan semua baris tanpa paginasi

### Scraper Functions

#### `fetchTournamentPage(tnrId, art, query?) → Promise<string>`

```typescript
// Fetch HTML mentah dari chess-results.com
// Gunakan fetch() server-side Next.js
// Timeout 15 detik
// Return HTML string atau throw ChessResultsError
```

#### `parseOverview(html) → TournamentMeta`

```typescript
interface TournamentMeta {
  name: string;           // Nama turnamen
  federation?: string;    // Kode federasi (e.g., "INA")
  startDate?: string;     // Tanggal mulai
  endDate?: string;       // Tanggal selesai
  rounds: number;         // Jumlah ronde
  arbiter?: string;       // Nama arbiter
  city?: string;          // Kota
}
```

#### `parsePlayerList(html) → ChessResultsPlayer[]`

```typescript
interface ChessResultsPlayer {
  startNo: number;        // Nomor start
  name: string;           // Nama pemain
  federation?: string;    // FED (e.g., "INA")
  rating?: number;        // Rating
  club?: string;          // Klub/sekolah
}
```

#### `parsePairings(html, roundNumber) → ChessResultsPairing[]`

```typescript
interface ChessResultsPairing {
  table: number;          // Nomor meja
  whiteName: string;      // Nama pemain putih
  blackName: string;      // Nama pemain hitam
  result?: string;        // "1-0", "0-1", "½-½", atau null (belum main)
}
```

#### `parseCrossTable(html) → ChessResultsResult[]`

```typescript
interface ChessResultsResult {
  playerName: string;
  roundResults: Map<number, {
    result: "1" | "0" | "½" | "";  // Hasil dari perspektif pemain
    opponentName?: string;           // Nama lawan
    color?: "W" | "B";              // Warna
  }>;
}
```

### Error Handling

```typescript
class ChessResultsError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "PARSE" | "NOT_FOUND" | "INVALID_URL"
  ) {
    super(message);
  }
}
```

- `NETWORK`: chess-results.com tidak bisa dijangkau / timeout
- `PARSE`: struktur HTML tidak sesuai format yang diharapkan
- `NOT_FOUND`: turnamen tidak ditemukan (404 pada chess-results.com)
- `INVALID_URL`: URL tidak valid atau bukan URL chess-results.com

### Rate Limiting

- Maksimal 1 request per detik ke chess-results.com
- Implementasi: delay sederhana menggunakan `setTimeout` promise
- Logging: catat setiap request dengan timestamp untuk audit

## Mapping chess-results.com → SMD Chess

### Pemain → Registrations

```
ChessResultsPlayer.name        → registrations.full_name
ChessResultsPlayer.rating      → registrations.chess_rating
ChessResultsPlayer.club        → registrations.school_name
"N/A"                          → registrations.student_status = "umum"
"N/A"                          → registrations.paid = TRUE  (peserta import dianggap lunas)
"N/A"                          → registrations.is_active = TRUE
"AUTO-{TNR}"                   → registrations.registration_id (prefix khusus import)
```

### Pairing → Rounds + Matches

- Setiap ronde: 1 `tournament_rounds` record
- Pairing per meja: 1 `matches` record

```
ChessResultsPairing.table      → matches.table_no
ChessResultsPairing.whiteName  → matches.player1_id (lookup nama → registration.id)
ChessResultsPairing.blackName  → matches.player2_id
ChessResultsPairing.result     → matches.player1_score, matches.player2_score
```

### Hasil → Update Matches

Cross table digunakan untuk melengkapi hasil per ronde:
- Jika `result = "1"` → player1_score = 1, player2_score = 0
- Jika `result = "0"` → player1_score = 0, player2_score = 1
- Jika `result = "½"` → player1_score = 0.5, player2_score = 0.5

### Deteksi Duplikat

Pemain dianggap duplikat jika `full_name` (case-insensitive, trimmed) sudah ada di turnamen yang sama. Pemain duplikat dilewati dan dilaporkan di hasil import.

## TRF Export Format

### Spesifikasi

Mengacu pada FIDE TRF16 standard (C04 Annex 2).

### Struktur File

```
012 {Tournament Name}
022 {City}
032 {Federation}          // "INA"
042 {Start Date} {End Date}
052 {Category}
062 {Arbiter}
092 {Number of Players}
102 {Number of Rounds}
132 {Federation Code}     // "INA"

XXR section (per player):
001  1  {Rating}  {Title}  {Name}            {FED}
001  2  {Rating}  {Title}  {Name}            {FED}
...

Round section (per ronde):
RD  {RoundNumber}  {Date}
{table}  {whiteNo}  {blackNo}  {result}
...
```

### Format Result Codes

- `1` = White win (1-0)
- `0` = Black win (0-1)
- `=` = Draw (½-½)
- `+` = White win by forfeit
- `-` = Black win by forfeit

### Contoh Output

```
012 Kejuaraan Catur Sumedang Open 2026
022 Sumedang
032 INA
042 2026/06/15 2026/06/20
062 Arbiter Utama
092 42
102 7
132 INA
001  1  2100     Budi Santoso              INA
001  2  1950     Ahmad Rizky               INA
001  3     0     Candra Wijaya             INA

RD  1  2026/06/15
 1  1  2  1
 2  4  3  0
 3  0  0  0 bye
```

### CSV Export Format

#### Player CSV
```csv
no,nama,rating,sekolah
1,Budi Santoso,2100,SMAN 1 Sumedang
2,Ahmad Rizky,1950,SMKN 2 Sumedang
```

#### Pairing CSV
```csv
meja,putih,hitam,hasil
1,Budi Santoso,Ahmad Rizky,1-0
2,Dewi Kartika,Candra Wijaya,½-½
```

#### Standings CSV
```csv
peringkat,nama,rating,poin,buchholz
1,Budi Santoso,2100,5.0,28.5
2,Ahmad Rizky,1950,4.5,27.0
```

## API Specifications

### POST /api/sync/import/chess-results

**Auth:** Admin only

**Request:**
```json
{
  "url": "https://chess-results.com/tnr123456.aspx?lan=18",
  "tournamentId": "uuid-smd-tournament"
}
```

**Response (200):**
```json
{
  "imported": {
    "players": 42,
    "rounds": 7,
    "matches": 287
  },
  "skipped": {
    "players": [
      { "name": "Budi Santoso", "reason": "duplikat nama" }
    ]
  }
}
```

**Error responses:**
- `400` — "URL chess-results.com tidak valid"
- `404` — "Turnamen tidak ditemukan"
- `409` — "Turnamen SMD sudah ongoing/finished"
- `502` — "chess-results.com tidak bisa dijangkau"
- `422` — "Gagal parse halaman chess-results.com"

### GET /api/sync/preview/chess-results

**Auth:** Admin only

**Query:** `?url=https://chess-results.com/tnr123456.aspx`

**Response (200):**
```json
{
  "tournamentName": "Kejuaraan Catur Sumedang Open 2026",
  "federation": "INA",
  "rounds": 7,
  "playerCount": 42,
  "startDate": "2026-06-15"
}
```

### GET /api/tournaments/[id]/export/trf

**Auth:** Admin only

**Response:** Content-Type `text/plain; charset=utf-8` + Content-Disposition attachment

### GET /api/tournaments/[id]/export/csv

**Auth:** Admin only

**Query:** `?type=players|pairings|standings`

**Response:** Content-Type `text/csv; charset=utf-8` + Content-Disposition attachment

## Skenario Test

### Import dari chess-results.com

**Happy Path:**
```
Given admin membuka halaman /admin/sync
And memasukkan URL "https://chess-results.com/tnr123456.aspx"
And memilih turnamen target "Sumedang Open 2026" (status: draft)
When admin klik "Pratinjau"
Then sistem menampilkan: nama turnamen, jumlah pemain (42), jumlah ronde (7)
When admin klik "Impor"
Then sistem menampilkan: "42 pemain berhasil diimpor, 7 ronde, 287 pertandingan"
And registrations muncul di turnamen dengan paid=TRUE
And rounds + matches tersimpan dengan pairing yang benar
```

**Error: Duplikat Pemain:**
```
Given 3 dari 42 pemain sudah terdaftar di turnamen SMD
When admin klik "Impor"
Then sistem menampilkan: "39 pemain berhasil diimpor, 3 dilewati"
And tabel skipped menampilkan nama + alasan "duplikat nama"
```

**Error: URL Tidak Valid:**
```
Given admin memasukkan URL "https://google.com"
When admin klik "Pratinjau"
Then sistem menampilkan error: "URL chess-results.com tidak valid"
```

**Error: chess-results.com Down:**
```
Given chess-results.com tidak bisa dijangkau
When admin klik "Impor"
Then sistem menampilkan error: "chess-results.com tidak bisa dijangkau. Coba lagi nanti."
```

**Error: Format Halaman Berubah:**
```
Given struktur HTML chess-results.com berubah
When sistem mencoba parse player list
Then sistem menampilkan error: "Gagal membaca data pemain. Format halaman mungkin telah berubah."
```

### Export TRF

**Happy Path:**
```
Given turnamen "Sumedang Open 2026" memiliki 42 pemain dan 7 ronde selesai
When admin klik "Export TRF"
Then browser mendownload file "sumedang-open-2026.trf"
And file bisa dibuka di Swiss-Manager tanpa error
```

**Edge: 0 Pemain:**
```
Given turnamen belum memiliki peserta terdaftar
When admin klik "Export TRF"
Then sistem menampilkan error: "Tidak ada peserta untuk diexport"
```

### Export CSV

**Happy Path:**
```
Given turnamen memiliki 42 pemain dan 7 ronde selesai
When admin klik "Export CSV Pemain"
Then browser mendownload file "sumedang-open-2026-players.csv"
And file berisi 42 baris + header
```

**Happy Path: Pairing CSV:**
```
Given turnamen memiliki 7 ronde dengan hasil lengkap
When admin klik "Export CSV Pairing"
Then browser mendownload file CSV dengan kolom: meja, putih, hitam, hasil
```
