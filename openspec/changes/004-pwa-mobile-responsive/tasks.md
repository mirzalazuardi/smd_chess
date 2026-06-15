# Tasks: PWA + Mobile Responsive

**Complexity tier:** MID — Multi-file changes with clear scope, 4-6 step tasks.

---

## Phase 1: PWA Setup

- [ ] **1.1** Install `@ducanh2912/next-pwa` package
  - Context: `package.json` (Next.js 14.2.21, React 18)
  - Run: `npm install @ducanh2912/next-pwa`
  - Verif: `npm ls @ducanh2912/next-pwa`

- [ ] **1.2** Generate PWA icons from `public/logo-percasi.jpg` (1557×1600)
  - Context: `public/logo-percasi.jpg`
  - Output: `public/icons/icon-192x192.png`, `icon-512x512.png`, `icon-maskable.png`
  - Use sharp to resize: 192×192, 512×512 (both regular + maskable with padding)
  - Verif: `file public/icons/icon-*.png` shows correct dimensions

- [ ] **1.3** Create `public/manifest.json`
  - Context: spec `specs/pwa-mobile.md`
  - Fields: name, short_name, theme_color (#1d4ed8), background_color, display: standalone, icons array
  - Verif: `npx tsc --noEmit` (JSON doesn't need tsc, manual review)

- [ ] **1.4** Configure PWA in `next.config.mjs`
  - Context: `next.config.mjs` (currently: images remotePatterns only)
  - Import `withPWA` from `@ducanh2912/next-pwa`
  - Wrap config: caching strategy per route (static: CacheFirst, pages: NetworkFirst, admin: NetworkOnly)
  - Verif: `npx tsc --noEmit`, `npm run build` succeeds

- [ ] **1.5** Add manifest + theme-color to root layout
  - Context: `src/app/layout.tsx`
  - Add `<link rel="manifest" href="/manifest.json" />`
  - Add `<meta name="theme-color" content="#1d4ed8" />`
  - Verif: `npx tsc --noEmit`

- [ ] **1.6** Create offline fallback page
  - Context: new `src/app/offline/page.tsx`
  - Simple: "Anda sedang offline" message with chess icon
  - Tailwind-styled, centered, dark mode support
  - Verif: `npx tsc --noEmit`

---

## Phase 2: Mobile Responsive — Public Pages

- [ ] **2.1** Fix pairing TV view responsive grid
  - Context: `src/app/(public)/pairing/[code]/[round]/tv-pairing-view.tsx`
  - Current: `grid-cols-3` fixed → Change: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Header/footer: stack vertically on mobile, horizontal on desktop
  - Verif: `npx tsc --noEmit`

- [ ] **2.2** Fix jadwal page mobile overflow
  - Context: `src/app/(public)/jadwal/[code]/page.tsx`
  - Match row layout uses `w-[40%]`/`w-[20%]` — add `truncate` to names
  - Add `text-sm` for mobile, ensure readable on 320px
  - Verif: `npx tsc --noEmit`

- [ ] **2.3** Fix klasemen table mobile scroll
  - Context: `src/app/(public)/klasemen/[code]/page.tsx`
  - Already has `overflow-x-auto` wrapper — add `min-w-[600px]` to table
  - Add `text-xs sm:text-sm` for responsive font size
  - Verif: `npx tsc --noEmit`

---

## Phase 3: Mobile Responsive — Admin Pages

- [ ] **3.1** Fix admin tournament table mobile scroll
  - Context: `src/app/admin/turnamen/page.tsx`
  - Already has `overflow-x-auto` — add `min-w-[500px]` to table
  - "Buat Turnamen" button: ensure doesn't overlap on small screens
  - Verif: `npx tsc --noEmit`

- [ ] **3.2** Fix admin pembayaran table mobile scroll
  - Context: `src/app/admin/pembayaran/[tournament_id]/page.tsx`
  - Already has `overflow-x-auto` — add `min-w-[640px]` to table
  - Verif: `npx tsc --noEmit`

- [ ] **3.3** Fix admin ronde detail mobile layout
  - Context: `src/app/admin/ronde/[tournament_id]/page.tsx`
  - Match row uses fixed `min-w-[150px]`/`min-w-[60px]` — add `truncate` to names
  - Header: "Meja Putih Hasil Hitam" — ensure scrollable on mobile
  - Verif: `npx tsc --noEmit`

---

## Phase 4: Finalize

- [ ] **4.1** Run full test suite — `npm test`
- [ ] **4.2** Run type check — `npx tsc --noEmit`
- [ ] **4.3** Run build — `npm run build`
- [ ] **4.4** Commit all changes
