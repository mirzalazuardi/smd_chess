import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/import/csv";

describe("parseCsv", () => {
  // Basic parsing
  it("parses single cell", () => {
    expect(parseCsv("hello")).toEqual([["hello"]]);
  });

  it("parses multiple cells in one row", () => {
    expect(parseCsv("a,b,c")).toEqual([["a", "b", "c"]]);
  });

  it("parses multiple rows", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("returns empty array for empty string", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("discards blank/whitespace-only lines", () => {
    expect(parseCsv("a,b\n   \nc,d")).toEqual([["a", "b"], ["c", "d"]]);
    expect(parseCsv("  \t  ")).toEqual([]);
  });

  it("handles \r\n line endings", () => {
    expect(parseCsv("a,b\r\nc,d")).toEqual([["a", "b"], ["c", "d"]]);
  });

  // Quoted cell tests (will fail until Task 2.3)
  it("keeps quoted cell with comma as one cell", () => {
    expect(parseCsv('"hello, world",b')).toEqual([["hello, world", "b"]]);
  });

  it("handles double-quote escape inside quoted cell", () => {
    expect(parseCsv('"say ""hi""",b')).toEqual([["say \"hi\"", "b"]]);
  });

  it("handles newline inside quoted cell", () => {
    expect(parseCsv('"line1\nline2",b')).toEqual([["line1\nline2", "b"]]);
  });

  it("handles empty quoted cell", () => {
    expect(parseCsv('"",b')).toEqual([["", "b"]]);
  });

  it("trims whitespace around unquoted cells but not inside quotes", () => {
    expect(parseCsv(' a , " b " , c ')).toEqual([["a", " b ", "c"]]);
  });
});
