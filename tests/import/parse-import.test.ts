import { describe, it, expect } from "vitest";
import {
  dedupeByName,
  mapImportRows,
  parseImport,
  validateHeader,
  validateImportRows,
  type MappedRow,
  type ValidRow,
} from "@/lib/import/parse-import";

describe("mapImportRows", () => {
  it("maps a row with school_name to student_status pelajar", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi Santoso", "SMA Negeri 1", "", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      lineNumber: 2,
      full_name: "Budi Santoso",
      school_name: "SMA Negeri 1",
      student_status: "pelajar",
      paid: false,
    });
  });

  it("maps a row without school_name to student_status umum", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Ani Rahayu", "", "", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].student_status).toBe("umum");
    expect(result[0].school_name).toBeUndefined();
  });

  it("maps paid=true from lunas=ya", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "ya", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].paid).toBe(true);
  });

  it("maps paid=true from lunas=TRUE (case insensitive)", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "true", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].paid).toBe(true);
  });

  it("maps paid=true from lunas=1", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "1", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].paid).toBe(true);
  });

  it("maps paid=true from lunas=lunas", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "lunas", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].paid).toBe(true);
  });

  it("maps paid=false for missing/other lunas value", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "tidak", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].paid).toBe(false);
  });

  it("lineNumber starts at 2 for first data row", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Row1", "", "", "", ""],
      ["Row2", "", "", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].lineNumber).toBe(2);
    expect(result[1].lineNumber).toBe(3);
  });

  it("trims whitespace from all fields", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["  Budi  ", "  SMA 1  ", " ya ", " 08123456789 ", " budi@test.com "],
    ];
    const result = mapImportRows(rows);
    expect(result[0].full_name).toBe("Budi");
    expect(result[0].school_name).toBe("SMA 1");
    expect(result[0].wa_number).toBe("08123456789");
    expect(result[0].email).toBe("budi@test.com");
  });

  it("empty optional fields become undefined", () => {
    const rows = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "", "", ""],
    ];
    const result = mapImportRows(rows);
    expect(result[0].school_name).toBeUndefined();
    expect(result[0].wa_number).toBeUndefined();
    expect(result[0].email).toBeUndefined();
  });
});

describe("validateHeader", () => {
  it("accepts correct header", () => {
    const header = ["nama", "sekolah", "lunas", "wa", "email"];
    expect(validateHeader(header)).toBeNull();
  });

  it("accepts header with different casing", () => {
    const header = ["Nama", "Sekolah", "Lunas", "WA", "Email"];
    expect(validateHeader(header)).toBeNull();
  });

  it("rejects missing column", () => {
    const header = ["nama", "sekolah", "lunas", "wa"];
    const err = validateHeader(header);
    expect(err).toBeTruthy();
    expect(err).toContain("email");
  });

  it("rejects wrong order", () => {
    const header = ["nama", "lunas", "sekolah", "wa", "email"];
    const err = validateHeader(header);
    expect(err).toBeTruthy();
  });

  it("rejects extra columns", () => {
    const header = ["nama", "sekolah", "lunas", "wa", "email", "extra"];
    const err = validateHeader(header);
    expect(err).toBeTruthy();
  });

  it("trims header values before comparison", () => {
    const header = [" nama ", " sekolah ", " lunas ", " wa ", " email "];
    expect(validateHeader(header)).toBeNull();
  });
});

describe("parseImport", () => {
  it("returns headerError for wrong header", () => {
    const records = [["wrong", "header"]];
    const result = parseImport(records);
    expect(result.headerError).toBeTruthy();
    expect(result.rows).toHaveLength(0);
  });

  it("returns rows for valid header", () => {
    const records = [
      ["nama", "sekolah", "lunas", "wa", "email"],
      ["Budi", "", "", "", ""],
    ];
    const result = parseImport(records);
    expect(result.headerError).toBeUndefined();
    expect(result.rows).toHaveLength(1);
  });
});

describe("validateImportRows", () => {
  it("separates valid and invalid rows", () => {
    const rows: MappedRow[] = [
      { lineNumber: 2, full_name: "Valid User", student_status: "umum", paid: false },
      { lineNumber: 3, full_name: "", student_status: "umum", paid: false },
    ];
    const { valid, invalid } = validateImportRows(rows);
    expect(valid).toHaveLength(1);
    expect(valid[0].full_name).toBe("Valid User");
    expect(invalid).toHaveLength(1);
    expect(invalid[0].lineNumber).toBe(3);
    expect(invalid[0].reason).toBeTruthy();
  });

  it("invalid row includes lineNumber, full_name, reason", () => {
    const rows: MappedRow[] = [
      { lineNumber: 2, full_name: "Dewi", student_status: "pelajar", paid: false },
    ];
    const { invalid } = validateImportRows(rows);
    expect(invalid).toHaveLength(1);
    expect(invalid[0]).toMatchObject({
      lineNumber: 2,
      full_name: "Dewi",
    });
    expect(invalid[0].reason).toBeTruthy();
  });

  it("all valid rows pass through", () => {
    const rows: MappedRow[] = [
      { lineNumber: 2, full_name: "Budi", student_status: "umum", paid: false },
      { lineNumber: 3, full_name: "Ani", student_status: "umum", paid: true },
    ];
    const { valid, invalid } = validateImportRows(rows);
    expect(valid).toHaveLength(2);
    expect(invalid).toHaveLength(0);
  });

  it("all invalid rows are caught", () => {
    const rows: MappedRow[] = [
      { lineNumber: 2, full_name: "", student_status: "umum", paid: false },
      { lineNumber: 3, full_name: "", student_status: "umum", paid: false },
    ];
    const { valid, invalid } = validateImportRows(rows);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(2);
  });
});

describe("dedupeByName", () => {
  it("returns empty when no rows", () => {
    const { unique, duplicates } = dedupeByName([], []);
    expect(unique).toHaveLength(0);
    expect(duplicates).toHaveLength(0);
  });

  it("detects duplicate vs existing names (case insensitive)", () => {
    const rows: ValidRow[] = [
      { lineNumber: 2, full_name: "budi santoso", student_status: "umum", paid: false },
    ];
    const existing = ["Budi Santoso"];
    const { unique, duplicates } = dedupeByName(rows, existing);
    expect(unique).toHaveLength(0);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].reason).toBe("duplikat nama");
    expect(duplicates[0].full_name).toBe("budi santoso");
  });

  it("detects duplicate within same file (keeps first)", () => {
    const rows: ValidRow[] = [
      { lineNumber: 2, full_name: "Budi", student_status: "umum", paid: false },
      { lineNumber: 3, full_name: "BUDI", student_status: "umum", paid: false },
      { lineNumber: 4, full_name: " budi ", student_status: "umum", paid: true },
    ];
    const { unique, duplicates } = dedupeByName(rows, []);
    expect(unique).toHaveLength(1);
    expect(unique[0].lineNumber).toBe(2);
    expect(duplicates).toHaveLength(2);
  });

  it("passes non-duplicate rows through", () => {
    const rows: ValidRow[] = [
      { lineNumber: 2, full_name: "Budi", student_status: "umum", paid: false },
      { lineNumber: 3, full_name: "Ani", student_status: "umum", paid: false },
    ];
    const { unique, duplicates } = dedupeByName(rows, ["Citra"]);
    expect(unique).toHaveLength(2);
    expect(duplicates).toHaveLength(0);
  });

  it("trims names before comparison", () => {
    const rows: ValidRow[] = [
      { lineNumber: 2, full_name: "  Budi  ", student_status: "umum", paid: false },
    ];
    const existing = ["budi"];
    const { unique, duplicates } = dedupeByName(rows, existing);
    expect(duplicates).toHaveLength(1);
  });
});
