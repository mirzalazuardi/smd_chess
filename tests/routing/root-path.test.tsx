import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation — notFound throws to simulate 404
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock the DB client — chain: from().select().eq().eq().single()
const mockSingle = vi.fn();
const mockEq2 = vi.fn(() => ({ single: mockSingle }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom }),
  ),
}));

import DaftarByCodePage from "@/app/(public)/daftar/[code]/page";

describe("/daftar/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for invalid tournament code", async () => {
    // Supabase returns null — tournament code not found
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      DaftarByCodePage({ params: Promise.resolve({ code: "invalid-code" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns 404 for non-open tournament", async () => {
    // Supabase returns null — tournament exists but status != 'open'
    // The query filters .eq("status", "open"), so it won't match
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      DaftarByCodePage({ params: Promise.resolve({ code: "closed-tourney" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
