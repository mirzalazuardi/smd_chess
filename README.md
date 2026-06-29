# SMD Chess

Sistem manajemen turnamen catur untuk Percasi Sumedang — registrasi online, verifikasi pembayaran, Swiss pairing, sinkronisasi chess-results.com, dan tampilan TV pairing.

## Fitur

- **Registrasi online** — formulir pendaftaran dengan unggahan bukti transfer
- **Verifikasi pembayaran** — admin verifikasi dan toggle status lunas
- **Swiss pairing** — generate pairing otomatis berdasarkan skor dan warna
- **Import CSV** — impor peserta via CSV dengan validasi
- **Sinkronisasi chess-results.com** — import data peserta dan pairing dari chess-results.com
- **Export TRF/CSV** — export data turnamen ke format TRF (FIDE) dan CSV
- **TV display** — tampilan pairing layar penuh dengan toggle tema dan auto-refresh
- **PWA** — dapat diinstal di mobile, offline support
- **Edit pairing manual** — admin dapat menyesuaikan pairing sebelum input hasil
- **Edit hasil ronde** — admin dapat mengoreksi skor setelah input

## Prasyarat

- Node.js 18+
- Supabase account (free tier)
- Vercel account (free tier)

## Instalasi

```bash
git clone <repo-url>
cd smd_chess
npm install
```

### Environment Variables

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Variabel yang diperlukan:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PWA (opsional — set "true" untuk test service worker saat dev)
# ENABLE_PWA=true

# Swiss Pairing (opsional)
SWISS_MAX_FLOAT_DOWN=2
```

### Database Setup

Jalankan migrasi Supabase:

```bash
npx supabase db push
```

## Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Testing

```bash
# Unit & integration tests (Vitest)
npm test

# Watch mode
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e
```

## Deployment

### Vercel

1. Hubungkan repo ke Vercel
2. Set environment variables di Vercel dashboard
3. Deploy

### Supabase

1. Buat project production
2. Jalankan migrasi terhadap production
3. Update Vercel env vars dengan production keys

## Routes

### Public

| Route | Deskripsi |
|---|---|
| `/` | Home page |
| `/daftar` | Formulir pendaftaran dengan dropdown turnamen |
| `/daftar/[code]` | Pendaftaran langsung untuk turnamen tertentu |
| `/daftar/sukses` | Halaman sukses pendaftaran |
| `/jadwal` | Daftar turnamen — pilih satu untuk lihat jadwal |
| `/jadwal/[code]` | Pairing per ronde untuk suatu turnamen |
| `/klasemen` | Daftar turnamen — pilih satu untuk lihat klasemen |
| `/klasemen/[code]` | Klasemen dengan tie-breaker Buchholz |
| `/pairing/[code]/[round]` | Tampilan TV — pairing layar penuh dengan toggle tema & auto-refresh |

### Admin

| Route | Deskripsi |
|---|---|
| `/admin/login` | Login admin (Supabase Auth) |
| `/admin` | Dashboard dengan quick links |
| `/admin/turnamen` | Daftar turnamen |
| `/admin/turnamen/baru` | Buat turnamen baru |
| `/admin/turnamen/[id]/edit` | Edit turnamen |
| `/admin/turnamen/[id]/import` | Import peserta via CSV |
| `/admin/ronde` | Daftar ronde — pilih turnamen |
| `/admin/ronde/[tournament_id]` | Kelola ronde: generate pairing, input hasil, edit pairing |
| `/admin/pembayaran` | Verifikasi pembayaran — pilih turnamen |
| `/admin/pembayaran/[tournament_id]` | Verifikasi pembayaran, toggle status lunas, lihat bukti |
| `/admin/sync` | Sinkronisasi data dari chess-results.com |

### API

| Method | Route | Deskripsi |
|---|---|---|
| `POST` | `/api/registrations` | Submit pendaftaran |
| `POST` | `/api/registrations/[id]/verify` | Toggle status pembayaran (admin) |
| `GET` | `/api/tournaments` | List semua turnamen |
| `POST` | `/api/tournaments` | Buat turnamen (admin) |
| `GET` | `/api/tournaments/[id]` | Detail turnamen |
| `PUT` | `/api/tournaments/[id]` | Update turnamen (admin) |
| `DELETE` | `/api/tournaments/[id]` | Hapus turnamen (admin) |
| `POST` | `/api/tournaments/[id]/import` | Import peserta via CSV (admin) |
| `GET` | `/api/tournaments/[id]/rounds` | List ronde untuk turnamen |
| `POST` | `/api/tournaments/[id]/rounds` | Generate Swiss pairing untuk ronde berikutnya (admin) |
| `POST` | `/api/rounds/[id]/results` | Simpan hasil pertandingan (admin) |
| `PATCH` | `/api/rounds/[id]/pairings` | Edit pairing manual sebelum hasil (admin) |
| `GET` | `/api/tournaments/[id]/export/trf` | Export file TRF (admin) |
| `GET` | `/api/tournaments/[id]/export/csv` | Export CSV daftar peserta (admin) |
| `POST` | `/api/sync/import/chess-results` | Import data dari chess-results.com (admin) |
| `GET` | `/api/sync/preview/chess-results` | Preview data chess-results.com (admin) |

## Struktur Project

```
src/
├── app/
│   ├── (public)/              # Halaman publik
│   │   ├── daftar/            # Alur pendaftaran
│   │   ├── jadwal/            # Jadwal pairing
│   │   ├── klasemen/          # Klasemen
│   │   └── pairing/           # Tampilan TV
│   ├── admin/                 # Dashboard admin (protected)
│   │   ├── login/             # Login admin
│   │   ├── turnamen/          # Manajemen turnamen
│   │   ├── pembayaran/        # Verifikasi pembayaran
│   │   ├── ronde/             # Manajemen ronde
│   │   └── sync/              # Sinkronisasi chess-results
│   ├── api/                   # API routes (REST)
│   ├── offline/               # Halaman offline (PWA)
│   ├── layout.tsx
│   ├── page.tsx               # Home
│   ├── error.tsx
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── forms/                 # Form components
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── auth/                  # Auth guards
│   ├── db/                    # Supabase clients & types
│   ├── swiss/                 # Swiss pairing engine
│   ├── sync/                  # chess-results sync (scraper, mapper, export)
│   ├── import/                # CSV import parsing
│   ├── validation/            # Zod schemas
│   └── utils/                 # Helpers
└── middleware.ts              # Next.js middleware (auth redirects)
```

## Panduan

- [Panduan Admin](docs/panduan-admin.md) — cara mengelola turnamen, ronde, dan pembayaran
- [Panduan Peserta](docs/panduan-peserta.md) — cara mendaftar dan melihat jadwal/klasemen
- [Panduan Wasit Swiss](docs/panduan-wasit-swiss.md) — alur pairing dan input hasil
- [Sinkronisasi chess-results.com](docs/sync-chess-results.md) — import data dari chess-results.com

## Spesifikasi Teknis

Lihat `openspec/project.md` untuk skema database lengkap, testing strategy, dan constraint teknis.

## License

Private — Percasi Sumedang
