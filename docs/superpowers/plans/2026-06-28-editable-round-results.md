# Editable Round Results — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to edit match results of the latest completed round before generating the next round's pairings.

**Architecture:** Add a `"Edit Hasil"` toggle button on the admin round page for the latest completed round. The `ResultInputForm` gets an `initialResults` prop for pre-population. The API gains a guard that rejects edits if a subsequent round already exists.

**Tech Stack:** Next.js 14 App Router, React Server Components, Vitest, Supabase

**Spec:** `openspec/changes/006-editable-round-results/specs/editable-round-results.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/api/rounds/[id]/results/route.ts` | Modify | API guard: reject edit if next round exists |
| `src/components/ui/result-input-form.tsx` | Modify | Accept `initialResults` prop for pre-population |
| `src/components/ui/edit-results-toggle.tsx` | **Create** | Client component: readonly display + toggle to `ResultInputForm` |
| `src/app/admin/ronde/[tournament_id]/page.tsx` | Modify | Use `EditResultsToggle` for completed-latest rounds |
| `tests/api/rounds-results-edit.test.ts` | **Create** | Unit tests for API guard |

---

### Task 1: API guard — reject edit if next round exists

**Files:**
- Modify: `src/app/api/rounds/[id]/results/route.ts`

- [ ] **Step 1: Read current file to confirm line numbers**

Run: `wc -l src/app/api/rounds/[id]/results/route.ts`
Expected: 66 lines

The guard must be added **before** the match update loop (line 38). We need the round's `tournament_id` and `round_number` to check for a subsequent round.

- [ ] **Step 2: Add guard logic**

Replace the entire file at `src/app/api/rounds/[id]/results/route.ts` with:

```typescript
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roundId } = await params;
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = await createServiceClient();

  try {
    const body = await request.json();
    const results = body.results as Array<{
      match_id: string;
      player1_score: number;
      player2_score: number | null;
    }>;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Data hasil pertandingan tidak valid" },
        { status: 400 },
      );
    }

    for (const r of results) {
      if (![0, 0.5, 1].includes(r.player1_score)) {
        return NextResponse.json(
          { error: "Skor harus 0, 0.5, atau 1" },
          { status: 400 },
        );
      }
    }

    // Guard: reject if a subsequent round already exists
    const { data: currentRound, error: roundErr } = await supabase
      .from("tournament_rounds")
      .select("round_number, tournament_id")
      .eq("id", roundId)
      .single();

    if (roundErr || !currentRound) {
      return NextResponse.json(
        { error: "Ronde tidak ditemukan" },
        { status: 404 },
      );
    }

    const { data: nextRound } = await supabase
      .from("tournament_rounds")
      .select("id")
      .eq("tournament_id", currentRound.tournament_id)
      .gt("round_number", currentRound.round_number)
      .limit(1)
      .single();

    if (nextRound) {
      return NextResponse.json(
        { error: "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah" },
        { status: 409 },
      );
    }

    for (const r of results) {
      const update: Record<string, unknown> = {
        player1_score: r.player1_score,
        status: "completed",
      };

      if (r.player2_score !== null && r.player2_score !== undefined) {
        update.player2_score = r.player2_score;
      }

      await supabase
        .from("matches")
        .update(update)
        .eq("id", r.match_id);
    }

    await supabase
      .from("tournament_rounds")
      .update({ status: "completed" })
      .eq("id", roundId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan hasil" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Run existing tests to confirm no regression**

```bash
npm test
```
Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rounds/[id]/results/route.ts
git commit -m "add api guard to reject round result edits when next round exists"
```

---

### Task 2: ResultInputForm — accept initial values

**Files:**
- Modify: `src/components/ui/result-input-form.tsx`

- [ ] **Step 1: Add `initialResults` prop and use it for state init**

The form currently initializes `results` as empty `{}`. We add an optional `initialResults` prop. Replace lines 1–67 (the component body up to the return statement):

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Match {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
}

interface Props {
  roundId: string;
  matches: (Match & { white_name?: string; black_name?: string })[];
  initialResults?: Record<string, { p1: number; p2: number | null }>;
}

export function ResultInputForm({ roundId, matches, initialResults }: Props) {
  const router = useRouter();
  const [results, setResults] = useState<
    Record<string, { p1: number; p2: number | null }>
  >(initialResults ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setResult(matchId: string, value: "1-0" | "0-1" | "0.5-0.5" | "") {
    if (!value) {
      const copy = { ...results };
      delete copy[matchId];
      setResults(copy);
      return;
    }
    const p1 = value === "1-0" ? 1 : value === "0-1" ? 0 : 0.5;
    const p2 = value === "1-0" ? 0 : value === "0-1" ? 1 : 0.5;
    setResults({ ...results, [matchId]: { p1, p2 } });
  }

  // ... rest of component unchanged (handleSave, JSX)
```

Lines 68+ (from `const activeMatches` to end of return) remain unchanged.

- [ ] **Step 2: Run compile check**

```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/result-input-form.tsx
git commit -m "add initialResults prop to ResultInputForm"
```

---

### Task 3: Create EditResultsToggle client component

**Files:**
- Create: `src/components/ui/edit-results-toggle.tsx`

This component shows match results as readonly text with an "Edit Hasil" button. On click, it swaps to `ResultInputForm`.

- [ ] **Step 1: Create the component**

Write `src/components/ui/edit-results-toggle.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ResultInputForm } from "./result-input-form";

interface MatchRow {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: string;
  white_name: string;
  black_name: string | null | undefined;
}

interface Props {
  roundId: string;
  matches: MatchRow[];
  initialResults: Record<string, { p1: number; p2: number | null }>;
}

export function EditResultsToggle({ roundId, matches, initialResults }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="mt-4 pt-4 border-t dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mengedit hasil
          </span>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            Batal
          </button>
        </div>
        <ResultInputForm
          roundId={roundId}
          matches={matches.map((m) => ({
            ...m,
            white_name: m.white_name,
            black_name: m.black_name ?? undefined,
          }))}
          initialResults={initialResults}
        />
      </div>
    );
  }

  const activeMatches = matches.filter((m) => m.player2_id);

  if (activeMatches.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Hasil tersimpan
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors"
        >
          Edit Hasil
        </button>
      </div>
      <div className="space-y-1.5">
        {activeMatches.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <span className="min-w-[120px] text-right truncate">
              {m.white_name ?? m.player1_id.slice(0, 8)}
            </span>
            <span className="font-mono min-w-[40px] text-center tabular-nums">
              {m.player1_score ?? "-"} - {m.player2_score ?? "-"}
            </span>
            <span className="min-w-[120px] truncate">
              {m.black_name ?? m.player2_id?.slice(0, 8) ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run compile check**

```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/edit-results-toggle.tsx
git commit -m "add EditResultsToggle component for editing completed round results"
```

---

### Task 4: Integrate EditResultsToggle into admin round page

**Files:**
- Modify: `src/app/admin/ronde/[tournament_id]/page.tsx`

Replace the `round.status === "ongoing"` condition on line 224 with logic that also uses `EditResultsToggle` for the latest completed round.

- [ ] **Step 1: Add import and replace conditional rendering**

In `src/app/admin/ronde/[tournament_id]/page.tsx`:

**Add import (after line 5, before line 7):**
```tsx
import { EditResultsToggle } from "@/components/ui/edit-results-toggle";
```

**Replace the block at lines 224–237:**
The current code:
```tsx
                {round.status === "ongoing" && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <ResultInputForm
                      roundId={round.id}
                      matches={round.matches?.map((m) => ({
                        ...m,
                        white_name: nameMap.get(m.player1_id),
                        black_name: m.player2_id
                          ? nameMap.get(m.player2_id)
                          : undefined,
                      })) ?? []}
                    />
                  </div>
                )}
```

Replace with:
```tsx
                {round.status === "ongoing" ? (
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <ResultInputForm
                      roundId={round.id}
                      matches={round.matches?.map((m) => ({
                        ...m,
                        white_name: nameMap.get(m.player1_id),
                        black_name: m.player2_id
                          ? nameMap.get(m.player2_id)
                          : undefined,
                      })) ?? []}
                    />
                  </div>
                ) : round.status === "completed" &&
                  round.round_number === rounds.length ? (
                  <EditResultsToggle
                    roundId={round.id}
                    matches={
                      round.matches?.map((m) => ({
                        ...m,
                        white_name:
                          nameMap.get(m.player1_id) ??
                          m.player1_id.slice(0, 8),
                        black_name: m.player2_id
                          ? nameMap.get(m.player2_id) ??
                            m.player2_id.slice(0, 8)
                          : null,
                      })) ?? []
                    }
                    initialResults={(() => {
                      const init: Record<
                        string,
                        { p1: number; p2: number | null }
                      > = {};
                      for (const m of round.matches ?? []) {
                        if (m.player2_id && m.player1_score !== null) {
                          init[m.id] = {
                            p1: m.player1_score,
                            p2: m.player2_score,
                          };
                        }
                      }
                      return init;
                    })()}
                  />
                ) : null}
```

**Logic explained:**
- `ongoing` → `ResultInputForm` (unchanged behavior)
- `completed` + is latest round (`round.round_number === rounds.length`) → `EditResultsToggle`
- `completed` + not latest round → nothing (readonly display already shown in the table above)

- [ ] **Step 2: Run compile check**

```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/ronde/[tournament_id]/page.tsx
git commit -m "integrate EditResultsToggle into admin round page for latest completed round"
```

---

### Task 5: Unit test — API guard

**Files:**
- Create: `tests/api/rounds-results-edit.test.ts`

Since the `PATCH` handler is a Next.js route handler that depends on Supabase, we test the **guard logic** in isolation by extracting a helper, or we write integration-style tests. Per project convention (Vitest, pure functions preferred), we test the guard condition directly.

- [ ] **Step 1: Extract guard logic into a testable helper**

Add to `src/lib/swiss/round.ts`:

```typescript
/**
 * Returns true if a round with a higher round_number exists
 * in the given array of rounds. Used to gate result editing.
 */
export function hasSubsequentRound(
  rounds: Array<{ round_number: number }>,
  currentRoundNumber: number,
): boolean {
  return rounds.some((r) => r.round_number > currentRoundNumber);
}
```

- [ ] **Step 2: Write the test**

Create `tests/api/rounds-results-edit.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hasSubsequentRound } from "@/lib/swiss/round";

describe("hasSubsequentRound", () => {
  const empty: Array<{ round_number: number }> = [];

  it("returns false when no rounds exist", () => {
    expect(hasSubsequentRound(empty, 1)).toBe(false);
  });

  it("returns false when current round is the highest", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
    ];
    expect(hasSubsequentRound(rounds, 2)).toBe(false);
  });

  it("returns true when a higher round_number exists", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
      { round_number: 3 },
    ];
    expect(hasSubsequentRound(rounds, 2)).toBe(true);
  });

  it("returns false when only lower rounds exist", () => {
    const rounds = [
      { round_number: 1 },
      { round_number: 2 },
    ];
    expect(hasSubsequentRound(rounds, 3)).toBe(false);
    expect(hasSubsequentRound(rounds, 4)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/api/rounds-results-edit.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: All tests pass (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/swiss/round.ts tests/api/rounds-results-edit.test.ts
git commit -m "add hasSubsequentRound guard and unit tests"
```

---

### Task 6: Use `hasSubsequentRound` in API route

**Files:**
- Modify: `src/app/api/rounds/[id]/results/route.ts`

Replace the inline guard query (the Supabase `.gt()` call from Task 1) with `hasSubsequentRound` from `src/lib/swiss/round.ts` for consistency with the tested helper.

- [ ] **Step 1: Replace guard in API route**

Replace lines 40–60 in `src/app/api/rounds/[id]/results/route.ts` (the guard block from Task 1) with:

```typescript
    // Guard: reject if a subsequent round already exists
    const { data: currentRound, error: roundErr } = await supabase
      .from("tournament_rounds")
      .select("round_number, tournament_id")
      .eq("id", roundId)
      .single();

    if (roundErr || !currentRound) {
      return NextResponse.json(
        { error: "Ronde tidak ditemukan" },
        { status: 404 },
      );
    }

    const { data: allRounds } = await supabase
      .from("tournament_rounds")
      .select("round_number")
      .eq("tournament_id", currentRound.tournament_id);

    if (
      allRounds &&
      hasSubsequentRound(allRounds, currentRound.round_number)
    ) {
      return NextResponse.json(
        { error: "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah" },
        { status: 409 },
      );
    }
```

Also add the import at the top:
```typescript
import { hasSubsequentRound } from "@/lib/swiss/round";
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rounds/[id]/results/route.ts
git commit -m "use hasSubsequentRound helper in results edit guard"
```

---

## Skenario Test Manual (Bahasa Indonesia)

Setelah semua task selesai, verifikasi manual:

### Happy Path
**Given** Turnamen dengan 4 peserta lunas, Ronde 1 sudah digenerate dan hasil disimpan (2 match completed)
**When** Admin buka `/admin/ronde/[tournament_id]`
**Then** Ronde 1 menampilkan hasil readonly + tombol kuning "Edit Hasil"
**When** Admin klik "Edit Hasil"
**Then** `ResultInputForm` muncul dengan nilai yang sudah tersimpan
**When** Admin ubah hasil Meja 1, klik "Simpan Hasil"
**Then** Hasil tersimpan, form hilang, kembali ke tampilan readonly

### Guard: Tidak bisa edit setelah Ronde 2 ada
**Given** Ronde 1 completed, Ronde 2 sudah digenerate
**When** Admin buka halaman ronde
**Then** Ronde 1 menampilkan hasil readonly TANPA tombol "Edit Hasil"
**When** Admin coba PATCH `/api/rounds/[ronde1-id]/results` langsung
**Then** Response 409 "Ronde berikutnya sudah digenerate, hasil tidak bisa diubah"

### Ongoing round
**Given** Ronde 1 ongoing (baru digenerate, belum ada hasil)
**When** Admin buka halaman ronde
**Then** `ResultInputForm` langsung tampil (seperti sebelumnya, tidak ada perubahan)
