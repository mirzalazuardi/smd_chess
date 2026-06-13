# Tasks: Fix Root Path & Multi-Tournament Registration

**Complexity tier:** MID — Multi-file, clear scope, 3-5 step tasks.

---

## Phase 1: TournamentIndex Component

- [x] **1.1** Create `src/components/ui/tournament-index.tsx` — file with Props interface and component shell
  - Context: `src/components/ui/` pattern
  - Props: `title`, `description`, `linkPrefix`, `statusFilter`, `emptyMessage`
  - Shell: export async function that returns placeholder `<main>TODO</main>`
  - Verif: `tsc --noEmit`

- [x] **1.2** Add status badge helpers — `statusLabels` and `statusStyles` objects
  - Context: copy pattern from `src/app/admin/page.tsx:100-110`
  - Labels: draft=Draft, open=Buka, ongoing=Berlangsung, finished=Selesai
  - Styles: draft=gray, open=green, ongoing=blue, finished=yellow
  - Verif: `tsc --noEmit`

- [x] **1.3** Implement empty state — render when no tournaments match filter
  - Context: same file
  - Query: `supabase.from("tournaments").select(...).in("status", statusFilter)`
  - If empty: centered title + `emptyMessage`
  - Verif: `tsc --noEmit`

- [x] **1.4** Implement tournament grid — responsive card layout
  - Context: same file
  - Each card: name, code (mono), status badge, rounds_count
  - Link: `href={\`${linkPrefix}/${tournament.code}\`}`
  - Layout: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
  - Verif: `tsc --noEmit`, component renders with mock data

---

## Phase 2: Jadwal Index Page

- [x] **2.1** Create `src/app/(public)/jadwal/page.tsx` — render `TournamentIndex`
  - Context: `src/app/(public)/jadwal/[code]/page.tsx` (existing pattern)
  - Props: title="Jadwal Pertandingan", linkPrefix="/jadwal", statusFilter=["ongoing","open","finished"]
  - Verif: `tsc --noEmit`, `npm test`

---

## Phase 3: Klasemen Index Page

- [x] **3.1** Create `src/app/(public)/klasemen/page.tsx` — render `TournamentIndex`
  - Context: `src/app/(public)/klasemen/[code]/page.tsx` (existing pattern)
  - Props: title="Klasemen", linkPrefix="/klasemen", statusFilter=["ongoing","finished"]
  - Verif: `tsc --noEmit`, `npm test`

---

## Phase 4: Direct Registration Route (TDD)

- [x] **4.1** Write unit test: `/daftar/[code]` — 404 for invalid tournament code
  - Context: `tests/routing/` directory (new file `root-path.test.tsx`)
  - Test: render page with invalid code → expect `notFound()` called
  - Verif: test fails (red) — implementation doesn't exist yet

- [x] **4.2** Write unit test: `/daftar/[code]` — 404 for non-open tournament
  - Context: same test file
  - Test: render page with code of `status != 'open'` → expect `notFound()`
  - Verif: test fails (red) — implementation doesn't exist yet

- [x] **4.3** Create `src/app/(public)/daftar/[code]/page.tsx` — fetch tournament by code with `status = 'open'`
  - Context: `src/app/(public)/daftar/page.tsx` (existing), `RegistrationForm` in `src/components/forms/registration-form.tsx`
  - Query: single tournament by code, filter `status = 'open'`
  - If not found → `notFound()`
  - Pass `tournaments={[tournament]}` to `RegistrationForm` (auto hidden input, no dropdown)
  - Verif: `tsc --noEmit`, tests from 4.1 & 4.2 pass (green)

---

## Phase 5: Manual Verification

- [ ] **5.1** Test navigation: `/` → "Lihat Jadwal" → `/jadwal` index → click tournament → `/jadwal/[code]`
- [ ] **5.2** Test navigation: `/` → "Klasemen" → `/klasemen` index → click tournament → `/klasemen/[code]`
- [ ] **5.3** Test navigation: `/admin` → "Lihat Jadwal" → `/jadwal` index
- [ ] **5.4** Test direct registration: `/daftar/[valid-open-code]` → form pre-selected, no dropdown
- [ ] **5.5** Test 404: `/daftar/[invalid-code]` and `/daftar/[non-open-code]` → 404 page
