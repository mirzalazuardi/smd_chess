# Proposal: MVP Tournament Flow

## Why

- Percasi Sumedang currently manages tournaments manually (spreadsheets, paper)
- Swiss pairing by hand is error-prone and slow between rounds
- No centralized registration — admins collect data via WhatsApp/forms
- Payment verification is scattered, no clear audit trail
- Participants have no easy way to check pairings or standings

## What Changes

- **Tournament management:** Create/configure tournaments with unique codes
- **Online registration:** Public form with proof-of-transfer upload
- **Payment verification:** Admin panel to view registrations and toggle `paid` status
- **Swiss pairing engine:** Generate pairings for each round from `paid=TRUE` players
- **Result input:** Admin enters match results per round
- **Public pages:** Pairings and standings pages (mobile-friendly, projector-friendly)

## Impact

- **Admins:** Faster tournament setup, clear payment status, one-click pairing generation
- **Participants:** Self-service registration, real-time access to pairings and standings
- **Data:** Structured records of all registrations, payments, rounds, and results
- **Risk:** Swiss pairing logic is the most complex piece — requires thorough testing
- **Dependency:** Supabase project must be set up before development starts
