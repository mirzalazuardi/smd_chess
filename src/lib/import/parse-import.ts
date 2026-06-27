import { importRowSchema } from "@/lib/validation/schemas";

const EXPECTED_HEADER = ["nama", "sekolah", "lunas", "wa", "email"];
const HEADER_ERROR = "Header CSV harus: nama, sekolah, lunas, wa, email";

export interface MappedRow {
  lineNumber: number;
  full_name: string;
  school_name?: string;
  student_status: "pelajar" | "umum";
  paid: boolean;
  wa_number?: string;
  email?: string;
}

export interface ValidRow extends MappedRow {}

export interface InvalidRow {
  lineNumber: number;
  full_name: string;
  reason: string;
}

export interface ImportResult {
  headerError?: string;
  rows: MappedRow[];
}

export interface ValidatedImportRows {
  valid: ValidRow[];
  invalid: InvalidRow[];
}

export interface DedupeResult {
  unique: ValidRow[];
  duplicates: InvalidRow[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function readCell(row: string[] | undefined, index: number): string {
  return (row?.[index] ?? "").trim();
}

function isPaidValue(value: string): boolean {
  const normalized = normalize(value);
  return normalized === "ya" || normalized === "true" || normalized === "1" || normalized === "lunas";
}

export function validateHeader(header: string[]): string | null {
  const normalized = header.map((value) => normalize(value));

  if (normalized.length !== EXPECTED_HEADER.length) {
    return HEADER_ERROR;
  }

  const matches = normalized.every((value, index) => value === EXPECTED_HEADER[index]);
  return matches ? null : HEADER_ERROR;
}

export function mapImportRows(records: string[][]): MappedRow[] {
  return records.slice(1).map((row, index) => {
    const full_name = readCell(row, 0);
    const school_name = readCell(row, 1);
    const wa_number = readCell(row, 3);
    const email = readCell(row, 4);

    const mapped: MappedRow = {
      lineNumber: index + 2,
      full_name,
      student_status: school_name ? "pelajar" : "umum",
      paid: isPaidValue(readCell(row, 2)),
    };

    if (school_name) mapped.school_name = school_name;
    if (wa_number) mapped.wa_number = wa_number;
    if (email) mapped.email = email;

    return mapped;
  });
}

export function parseImport(records: string[][]): ImportResult {
  const header = records[0] ?? [];
  const headerError = validateHeader(header);

  if (headerError) {
    return { headerError, rows: [] };
  }

  return { rows: mapImportRows(records) };
}

export function validateImportRows(mappedRows: MappedRow[]): ValidatedImportRows {
  const valid: ValidRow[] = [];
  const invalid: InvalidRow[] = [];

  for (const row of mappedRows) {
    const result = importRowSchema.safeParse(row);

    if (result.success) {
      valid.push({ ...result.data, lineNumber: row.lineNumber });
      continue;
    }

    const firstError = result.error.errors[0] ?? result.error.issues[0];
    invalid.push({
      lineNumber: row.lineNumber,
      full_name: row.full_name,
      reason: firstError?.message ?? "Data tidak valid",
    });
  }

  return { valid, invalid };
}

export function dedupeByName(valid: ValidRow[], existingNames: string[]): DedupeResult {
  const seen = new Set(existingNames.map(normalize).filter(Boolean));
  const unique: ValidRow[] = [];
  const duplicates: InvalidRow[] = [];

  for (const row of valid) {
    const normalizedName = normalize(row.full_name);

    if (seen.has(normalizedName)) {
      duplicates.push({
        lineNumber: row.lineNumber,
        full_name: row.full_name,
        reason: "duplikat nama",
      });
      continue;
    }

    seen.add(normalizedName);
    unique.push(row);
  }

  return { unique, duplicates };
}
