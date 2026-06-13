# Tasks: MVP Tournament Flow

**Complexity tier:** MID — Multi-file changes with clear scope, 3-5 step tasks.

---

## Phase 1: Project Setup

- [x] **1.1** Initialize Next.js 14 project with TypeScript, App Router, Tailwind
- [x] **1.2** Set up Supabase client library (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] **1.3** Create `.env.example` with required variables
- [x] **1.4** Set up Vitest with TypeScript support
- [x] **1.5** Create initial Supabase migration with all tables (tournaments, registrations, tournament_rounds, matches)

## Phase 2: Registration Flow

- [x] **2.1** Create Zod schemas for registration validation
- [x] **2.2** Build registration form component (all fields, file upload)
- [x] **2.3** Create API route `POST /api/registrations` — validate, upload proof, insert record
- [x] **2.4** Generate registration ID in format `CATUR{YEAR}-{SEQ}`
- [x] **2.5** Add duplicate email check per tournament
- [x] **2.6** Create registration success page with registration ID display
- [x] **2.7** Write tests for registration validation

## Phase 3: Admin Authentication

- [x] **3.1** Set up Supabase Auth with email/password for admins
- [x] **3.2** Create admin login page
- [x] **3.3** Create auth middleware for `/admin/*` routes
- [x] **3.4** Create admin layout with navigation

## Phase 4: Tournament Management (Admin)

- [x] **4.1** Create tournament list page
- [x] **4.2** Create tournament form (code, name, rounds_count)
- [x] **4.3** Create API routes for tournament CRUD
- [x] **4.4** Add tournament code validation (`^[a-z0-9_]+$`)

## Phase 5: Payment Verification (Admin)

- [ ] **5.1** Create registrations list page per tournament (filterable by paid status)
- [ ] **5.2** Add proof image viewer (modal or inline)
- [ ] **5.3** Create toggle button to set `paid = TRUE/FALSE`
- [ ] **5.4** Record `payment_verified_at` and `payment_verified_by`
- [ ] **5.5** Write tests for payment status filtering

## Phase 6: Swiss Pairing Engine

- [ ] **6.1** Create Swiss pairing algorithm in `src/lib/swiss/`
  - Group players by score
  - Sort by score desc, then rating desc
  - Pair within score groups
  - Avoid repeat pairings
  - Alternate colors (track last color)
  - Handle odd player (bye)
- [ ] **6.2** Write comprehensive tests for pairing logic
- [ ] **6.3** Create standings calculator with Buchholz tie-breaker
- [ ] **6.4** Write tests for standings calculation
- [ ] **6.5** Ensure all queries filter `paid = TRUE AND is_active = TRUE`

## Phase 7: Round Management (Admin)

- [ ] **7.1** Create round list page per tournament
- [ ] **7.2** Add "Generate Pairings" button for new round
- [ ] **7.3** Create pairings display with result input form
- [ ] **7.4** Create API route to save match results
- [ ] **7.5** Add round status transitions (pending → ongoing → completed)

## Phase 8: Public Pages

- [ ] **8.1** Create pairings page `/jadwal/[tournament_code]/[round]`
- [ ] **8.2** Create standings page `/klasemen/[tournament_code]`
- [ ] **8.3** Style for mobile and projector display
- [ ] **8.4** Add auto-refresh or manual refresh for live updates

## Phase 9: Polish & Deploy

- [ ] **9.1** Add loading states and error handling
- [ ] **9.2** Test full flow end-to-end
- [ ] **9.3** Deploy to Vercel
- [ ] **9.4** Configure Supabase production project
- [ ] **9.5** Verify free tier limits are respected
