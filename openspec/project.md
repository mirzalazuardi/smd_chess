# SMD Chess — Project Specification

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Frontend | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Validation | Zod | 3.x |
| Testing | Vitest | 1.x |
| Deployment | Vercel | Free tier |

## File Structure

```
smd_chess/
├── src/
│   ├── app/
│   │   ├── (public)/          # Public pages
│   │   │   ├── daftar/        # Registration form
│   │   │   ├── jadwal/        # Pairings per round
│   │   │   └── klasemen/      # Standings
│   │   ├── admin/             # Admin pages (protected)
│   │   │   ├── turnamen/      # Tournament management
│   │   │   ├── pembayaran/    # Payment verification
│   │   │   └── ronde/         # Round management
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── swiss/             # Swiss pairing algorithm
│   │   ├── sync/              # chess-results.com sync (import/export)
│   │   ├── import/            # CSV import parsing
│   │   ├── db/                # Supabase client, queries
│   │   ├── validation/        # Zod schemas
│   │   └── utils/             # Helpers
│   └── components/
│       ├── ui/                # Base UI components
│       └── forms/             # Form components
├── supabase/
│   └── migrations/            # SQL migrations (timestamped)
├── tests/
│   ├── swiss/                 # Pairing logic tests
│   └── registration/          # Registration tests
├── openspec/
│   ├── AGENTS.md
│   ├── project.md
│   └── changes/
├── public/
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

## Database Schema

### tournaments
- `id` UUID PRIMARY KEY
- `code` VARCHAR UNIQUE NOT NULL — `^[a-z0-9_]+$`
- `name` VARCHAR NOT NULL
- `description` TEXT
- `rounds_count` INT NOT NULL DEFAULT 5
- `status` ENUM('draft', 'open', 'ongoing', 'finished')
- `created_at`, `updated_at` TIMESTAMP

### registrations
- `id` UUID PRIMARY KEY
- `registration_id` VARCHAR UNIQUE NOT NULL — `CATUR{YEAR}-{SEQ}`
- `tournament_id` UUID REFERENCES tournaments
- `full_name` VARCHAR NOT NULL
- `email` VARCHAR
- `student_status` ENUM('pelajar', 'umum') NOT NULL
- `school_name` VARCHAR — required if pelajar
- `wa_number` VARCHAR
- `chess_rating` INT — optional
- `proof_transfer_url` VARCHAR
- `paid` BOOLEAN NOT NULL DEFAULT FALSE
- `payment_verified_at` TIMESTAMP
- `payment_verified_by` UUID — admin user ID
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMP
- UNIQUE(tournament_id, email)

### tournament_rounds
- `id` UUID PRIMARY KEY
- `tournament_id` UUID REFERENCES tournaments
- `round_number` INT NOT NULL
- `status` ENUM('pending', 'pairing', 'ongoing', 'completed')
- `created_at` TIMESTAMP
- UNIQUE(tournament_id, round_number)

### matches
- `id` UUID PRIMARY KEY
- `round_id` UUID REFERENCES tournament_rounds
- `player1_id` UUID REFERENCES registrations — white
- `player2_id` UUID REFERENCES registrations — black (NULL for bye)
- `table_no` INT — sequential number (NULL for bye), CHECK > 0
- `player1_score` DECIMAL(2,1) — 1, 0.5, or 0
- `player2_score` DECIMAL(2,1)
- `status` ENUM('pending', 'ongoing', 'completed')
- `created_at`, `updated_at` TIMESTAMP
- INDEX `idx_matches_table_no` on `(round_id, table_no)`

## Testing Strategy

**Location:** `tests/` directory, mirroring `src/lib/` structure

**Must be covered:**
- Swiss pairing: grouping by score, color alternation, repeat avoidance, bye assignment
- Payment filtering: standings/pairing queries MUST filter `paid = TRUE`
- Registration: email uniqueness per tournament, code format, required fields

**Run:** `npm test` (Vitest)

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/tournaments/[id]/rounds` | Generate Swiss pairings for next round (admin) |
| `POST` | `/api/rounds/[id]/results` | Save match results (admin) |
| `POST` | `/api/tournaments/[id]/import` | Import peserta via CSV (admin) |
| `PATCH` | `/api/rounds/[id]/pairings` | Edit pairings manually before results (admin) |
| `POST` | `/api/sync/import/chess-results` | Import dari chess-results.com (admin) |
| `GET` | `/api/sync/preview/chess-results` | Preview data chess-results.com (admin) |
| `GET` | `/api/tournaments/[id]/export/trf` | Export TRF file (admin) |
| `GET` | `/api/tournaments/[id]/export/csv` | Export CSV player list (admin) |

## Git Conventions

**Branch naming:** `feat/short-description`, `fix/short-description`

**Commit style:** lowercase, no period, imperative mood
```
add registration form
fix swiss pairing color alternation
update payment verification ui
```

## Constraints

- MUST work on Vercel free tier + Supabase free tier
- UI MUST be in Bahasa Indonesia
- Swiss pairing MUST only include `paid = TRUE AND is_active = TRUE`
- Standings MUST only show `paid = TRUE` players
- Registration ID auto-increment per calendar year

## What NOT To Do

- Do NOT compute standings without `WHERE paid = TRUE`
- Do NOT trust client-side validation for `paid` status
- Do NOT allow duplicate emails within same tournament
- Do NOT store Supabase service key in client code
- Do NOT hard-code tournament codes

## Open Questions (Decide Later)

- Tie-breaker beyond Buchholz (Sonneborn-Berger, direct encounter)
- Multiple categories per tournament (e.g., Pelajar vs Umum brackets)
- Player rating calculation post-tournament
- Export to FIDE-compatible formats
