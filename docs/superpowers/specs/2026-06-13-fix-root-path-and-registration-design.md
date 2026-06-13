# Design: Fix Root Path & Multi-Tournament Registration

**Date:** 2026-06-13
**Status:** Approved
**Approach:** B — DRY shared component

## Problem

1. `/jadwal` dan `/klasemen` links di home page/admin/sukses broken — routes require `[code]` parameter
2. `/daftar` tidak punya direkt link per turnamen (`/daftar/[code]`) untuk QR code/poster

## Solution

### Routes

| URL | New? | Behavior |
|-----|------|----------|
| `/jadwal` | **NEW** | Tournament index → list all active tournaments, link to `/jadwal/[code]` |
| `/jadwal/[code]` | existing | Pairings per tournament |
| `/klasemen` | **NEW** | Tournament index → list tournaments, link to `/klasemen/[code]` |
| `/klasemen/[code]` | existing | Standings per tournament |
| `/daftar` | existing | Registration form with tournament dropdown (fallback) |
| `/daftar/[code]` | **NEW** | Direct registration, tournament pre-selected |

### Files

```
NEW:
  src/components/ui/tournament-index.tsx    — reusable index component
  src/app/(public)/jadwal/page.tsx          — tournament index for jadwal
  src/app/(public)/klasemen/page.tsx        — tournament index for klasemen  
  src/app/(public)/daftar/[code]/page.tsx   — direct registration

EXISTING (no changes):
  src/app/(public)/jadwal/[code]/page.tsx
  src/app/(public)/klasemen/[code]/page.tsx
  src/app/(public)/daftar/page.tsx
  src/app/(public)/daftar/sukses/page.tsx
  src/components/forms/registration-form.tsx
```

### TournamentIndex Component

Server component. Props:

```
title: string          — "Jadwal Pertandingan" | "Klasemen"
description: string    — subtitle
linkPrefix: string     — "/jadwal" | "/klasemen"
statusFilter: string[] — ["ongoing","open"] | ["ongoing","finished"]
emptyMessage: string   — shown when no tournaments match
```

Fetches `tournaments WHERE status IN (statusFilter) ORDER BY created_at DESC`. Renders responsive grid of cards. Each card shows: name, code, status badge, round count. Click → `/${linkPrefix}/${code}`.

### /daftar/[code] Page

Server component. Fetches single tournament by code with `status = 'open'`. If not found → 404. Passes `tournaments={[tournament]}` to existing `RegistrationForm` — form auto-detects single tournament and uses hidden input (no dropdown).

## Testing

- Unit: TournamentIndex rendering, empty state, status filter
- Unit: /daftar/[code] — 404 for invalid code, 404 for non-open tournament
- Manual: click "Lihat Jadwal" from home → index → tournament detail
- Manual: click "Lihat Jadwal" from admin dashboard → index
- Manual: /daftar/[code] form pre-filled, no dropdown
- Manual: /daftar still shows dropdown when multiple tournaments open

## Out of Scope

- `/daftar` form redesign
- QR code generation
- Tournament detail page (separate feature)
