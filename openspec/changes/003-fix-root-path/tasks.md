# Tasks: Fix Root Path & Multi-Tournament Registration

**Complexity tier:** MID — Multi-file, clear scope, 3-5 step tasks.

---

## Phase 1: TournamentIndex Component

- [ ] **1.1** Create `src/components/ui/tournament-index.tsx` — server component with props: `title`, `description`, `linkPrefix`, `statusFilter`, `emptyMessage`
  - Context: `src/components/ui/` pattern, fetch from `@/lib/db/server`
  - Query: `tournaments WHERE status IN (statusFilter) ORDER BY created_at DESC`
  - Each card: name, code (mono), status badge, rounds_count
  - Link: `href={/${linkPrefix}/${tournament.code}}`
  - State: empty → `emptyMessage`, data → responsive grid
  - Verif: `tsc --noEmit`, page renders without error

---

## Phase 2: Jadwal Index Page

- [ ] **2.1** Create `src/app/(public)/jadwal/page.tsx` — render `TournamentIndex`
  - Context: `src/app/(public)/jadwal/[code]/page.tsx` (existing pattern)
  - Props: title="Jadwal Pertandingan", linkPrefix="/jadwal", statusFilter=["ongoing","open","finished"]
  - Verif: `tsc --noEmit`, `npm test`

---

## Phase 3: Klasemen Index Page

- [ ] **3.1** Create `src/app/(public)/klasemen/page.tsx` — render `TournamentIndex`
  - Context: `src/app/(public)/klasemen/[code]/page.tsx` (existing pattern)
  - Props: title="Klasemen", linkPrefix="/klasemen", statusFilter=["ongoing","finished"]
  - Verif: `tsc --noEmit`, `npm test`

---

## Phase 4: Direct Registration Route

- [ ] **4.1** Create `src/app/(public)/daftar/[code]/page.tsx` — fetch tournament by code with `status = 'open'`
  - Context: `src/app/(public)/daftar/page.tsx` (existing), `RegistrationForm` in `src/components/forms/registration-form.tsx`
  - Query: single tournament by code, filter `status = 'open'`
  - If not found → `notFound()`
  - Pass `tournaments={[tournament]}` to `RegistrationForm` (auto hidden input, no dropdown)
  - Verif: `tsc --noEmit`, `npm test`

- [ ] **4.2** Write unit test: `/daftar/[code]` — 404 for invalid tournament code
  - Context: `tests/registration/` directory
  - Test: render page with invalid code → expect `notFound()` called
  - Verif: test fails (red), then passes (green) after 4.1

- [ ] **4.3** Write unit test: `/daftar/[code]` — 404 for non-open tournament
  - Context: same test file
  - Test: render page with code of `status != 'open'` → expect `notFound()`
  - Verif: test fails (red), then passes (green) after 4.1

---

## Phase 5: Verification

- [ ] **5.1** Run `npm test` — all tests pass
- [ ] **5.2** Run `tsc --noEmit` — zero type errors
- [ ] **5.3** Verify links on home page (`/`) — "Lihat Jadwal" → `/jadwal` index, "Klasemen" → `/klasemen` index
- [ ] **5.4** Verify admin dashboard link "Lihat Jadwal" → `/jadwal` index
