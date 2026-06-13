# SMD Chess

Sistem manajemen turnamen catur untuk Percasi Sumedang — registrasi online, verifikasi pembayaran, dan Swiss pairing.

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Vercel account (free tier)

### Installation

```bash
git clone <repo-url>
cd smd_chess
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run Supabase migrations:
```bash
npx supabase db push
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## Deployment

### Vercel

1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Supabase

1. Create production project
2. Run migrations against production
3. Update Vercel env vars with production keys

## Routes

### Public

| Route | Description |
|---|---|
| `/` | Home page |
| `/daftar` | Registration form with tournament dropdown |
| `/daftar/[code]` | Direct registration for a specific tournament |
| `/daftar/sukses` | Registration success page |
| `/jadwal` | Tournament list — pick one to view schedule |
| `/jadwal/[code]` | Round-by-round pairings for a tournament |
| `/klasemen` | Tournament list — pick one to view standings |
| `/klasemen/[code]` | Standings with Buchholz tie-breaker |
| `/pairing/[code]/[round]` | TV display — full-screen pairings with theme toggle and auto-refresh |

### Admin

| Route | Description |
|---|---|
| `/admin/login` | Admin login (Supabase Auth) |
| `/admin` | Dashboard with quick links |
| `/admin/turnamen` | Tournament list |
| `/admin/turnamen/baru` | Create tournament |
| `/admin/turnamen/[id]/edit` | Edit tournament |
| `/admin/ronde` | Round list — pick tournament |
| `/admin/ronde/[tournament_id]` | Manage round: generate pairings, input results |
| `/admin/pembayaran` | Payment verification — pick tournament |
| `/admin/pembayaran/[tournament_id]` | Verify payments, toggle paid status, view proof |

### API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/registrations` | Submit registration |
| `POST` | `/api/registrations/[id]/verify` | Toggle payment status (admin) |
| `GET` | `/api/tournaments` | List all tournaments |
| `POST` | `/api/tournaments` | Create tournament (admin) |
| `GET` | `/api/tournaments/[id]` | Get tournament details |
| `PUT` | `/api/tournaments/[id]` | Update tournament (admin) |
| `DELETE` | `/api/tournaments/[id]` | Delete tournament (admin) |
| `GET` | `/api/tournaments/[id]/rounds` | List rounds for a tournament |
| `POST` | `/api/tournaments/[id]/rounds` | Generate Swiss pairings for next round (admin) |
| `POST` | `/api/rounds/[id]/results` | Save match results (admin) |

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public-facing pages
│   │   ├── daftar/        # Registration flow
│   │   ├── jadwal/        # Pairing schedule
│   │   ├── klasemen/      # Standings
│   │   └── pairing/       # TV display
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes (REST)
├── components/
│   ├── forms/             # Form components (registration)
│   └── ui/                # Reusable UI components
└── lib/
    ├── auth/              # Auth guards
    ├── db/                # Supabase clients
    ├── swiss/             # Swiss pairing engine
    ├── utils/             # Helpers
    └── validation/        # Zod schemas
```

See `openspec/project.md` for detailed database schema and specification.

## License

Private — Percasi Sumedang
