# Tasks: Table Number for Match Pairings

## Phase 1: Database & Types

- [x] **1.1** Create migration `YYYYMMDDHHMMSS_add_table_no.sql` — add `table_no INT` column to `matches` table with CHECK constraint `table_no > 0`
- [ ] **1.2** Add index `idx_matches_table_no` on `(round_id, table_no)` for query performance
- [ ] **1.3** Update `Pairing` interface in `src/lib/swiss/types.ts` — add `tableNo: number | null`

## Phase 2: Pairing Logic

- [ ] **2.1** Modify `generateSwissPairings()` in `src/lib/swiss/pairing.ts` — assign sequential `tableNo` starting from 1, null for bye
- [ ] **2.2** Write unit test: table 1 = highest scoring pair
- [ ] **2.3** Write unit test: bye gets `tableNo = null`
- [ ] **2.4** Write unit test: sequential table numbers for all regular matches

## Phase 3: API

- [ ] **3.1** Update `POST /api/rounds/[id]/generate/route.ts` — include `table_no` in match insert

## Phase 4: Admin UI

- [ ] **4.1** Update admin page `src/app/admin/ronde/[tournament_id]/page.tsx` — add "Meja" column to matches display
- [ ] **4.2** Update query to order by `table_no ASC NULLS LAST`

## Phase 5: Theme Toggle Component

- [ ] **5.1** Check `tailwind.config.ts` — ensure `darkMode: 'class'` is configured
- [ ] **5.2** Create `src/components/ui/theme-toggle.tsx` — toggle button with sun/moon icon
- [ ] **5.3** Implement localStorage persistence for theme state
- [ ] **5.4** Support URL param `?theme=dark` to force mode

## Phase 6: Public TV Display Page

- [ ] **6.1** Create route `src/app/(public)/pairing/[code]/[round]/page.tsx`
- [ ] **6.2** Fetch tournament and round data by code and round number
- [ ] **6.3** Implement 3-column layout (17 rows each = max 51 meja)
- [ ] **6.4** Apply day mode styles — white bg, dark text, gray borders
- [ ] **6.5** Apply night mode styles — dark bg, light text, dark borders
- [ ] **6.6** Add theme toggle button to header
- [ ] **6.7** Implement auto-refresh every 30 seconds
- [ ] **6.8** Add round navigation (prev/next) in footer
- [ ] **6.9** Ensure `100vh` height, no scroll

## Phase 7: Testing & Verification

- [ ] **7.1** Run all unit tests — `npm test`
- [ ] **7.2** Manual test: generate pairing, verify table numbers assigned correctly
- [ ] **7.3** Manual test: admin page shows Meja column
- [ ] **7.4** Manual test: public TV page displays correctly at 1920x1080
- [ ] **7.5** Manual test: theme toggle persists after refresh
- [ ] **7.6** Manual test: `?theme=dark` URL param works

## Phase 8: Documentation

- [ ] **8.1** Update `docs/panduan-wasit-swiss.md` — add section about table numbers
- [ ] **8.2** Update `openspec/project.md` — add `table_no` to matches schema
