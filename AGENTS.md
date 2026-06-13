# SMD Chess — Sistem Turnamen Catur Percasi Sumedang

Chess tournament management system with online registration, manual payment verification, and Swiss pairing.

## Big Picture

**Problem:** Percasi Sumedang runs chess tournaments with manual registration and Swiss pairing workflows that are error-prone and time-consuming.

**Target users:**
- Admin team (<10 people): verify payments, manage rounds, input results
- Participants (students/adults): register online, check pairings and standings on mobile

**Critical user flows:**
1. Player registration — submit form with proof of transfer, get unique registration ID
2. Admin payment verification — view registrations, check proof image, toggle `paid` status
3. Swiss pairing — generate pairings from `paid=TRUE` players, input results, publish standings

**Architecture:**
- Next.js 14+ App Router (monorepo)
- Supabase: PostgreSQL, Auth (admin), Storage (proof images)
- Vercel deployment (free tier)
- UI in Bahasa Indonesia

## Configuration

**Environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side only, never expose
- `NEXT_PUBLIC_APP_URL` — Base URL for the app

**Environments:**
- `development` — local Supabase (or remote dev project)
- `production` — Vercel + Supabase production

**Feature flags (future):** Use env vars like `FEATURE_EMAIL_NOTIFICATIONS=true` when needed.

## Style Guide

**Preamble:** Clarity over cleverness. Explicit over magic. Minimal abstractions.

**SOLID (pragmatic):**
- SRP: One reason to change per module
- OCP: Extend via composition, not modification
- LSP: Subtypes must be substitutable
- ISP: Small, focused interfaces
- DIP: Depend on abstractions in core logic

**Stack conventions:**
- Next.js App Router with Server Components by default
- Client Components only when needed (interactivity, hooks)
- Supabase client: use `createServerClient` in Server Components/API routes
- Zod for all input validation

**Naming:**
- Files: `kebab-case.ts`, `PascalCase.tsx` for components
- Tables: `snake_case` (e.g., `tournament_rounds`)
- Env vars: `SCREAMING_SNAKE_CASE`

**Testing:**
- Unit tests in `tests/` using Vitest
- Critical paths: Swiss pairing, payment filtering, registration validation
- Run `npm test` before commits

## For AI Agents

**OpenSpec location:** `openspec/project.md` for project spec, `openspec/changes/` for proposals.

**Key rules:**
- NEVER bypass `paid = TRUE` filter in pairing or standings queries
- NEVER modify database schema without updating `openspec/project.md`
- NEVER commit secrets or `.env` files
- Registration ID format: `CATUR{YEAR}-{SEQUENCE}` (e.g., `CATUR2026-001`)
- Tournament code validation: `^[a-z0-9_]+$`
- **Every PR must include "Skenario Test" section in Bahasa Indonesia** (Given/When/Then format, happy path + error + edge cases)

**Path-scoped files:** As codebase grows, add `src/lib/swiss/CLAUDE.md` for domain-specific guidance.
