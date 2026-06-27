import { describe, it, expect } from "vitest";
import { importRowSchema } from "@/lib/validation/schemas";

describe("importRowSchema", () => {
  it("accepts valid umum row (no school, no wa, no email)", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi Santoso",
      student_status: "umum",
      paid: false,
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid pelajar row with school", () => {
    const result = importRowSchema.safeParse({
      full_name: "Ani Rahayu",
      student_status: "pelajar",
      school_name: "SMA Negeri 1 Sumedang",
      paid: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects pelajar without school_name", () => {
    const result = importRowSchema.safeParse({
      full_name: "Ani Rahayu",
      student_status: "pelajar",
      paid: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("school_name");
    }
  });

  it("rejects empty full_name", () => {
    const result = importRowSchema.safeParse({
      full_name: "",
      student_status: "umum",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects full_name over 100 chars", () => {
    const result = importRowSchema.safeParse({
      full_name: "x".repeat(101),
      student_status: "umum",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects wa_number with letters", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      wa_number: "0812abc4567",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects wa_number too short", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      wa_number: "0812",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid wa_number of 10 digits", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      wa_number: "0812345678",
      paid: false,
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid wa_number of 15 digits", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      wa_number: "081234567890123",
      paid: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      email: "not-an-email",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      email: "budi@example.com",
      paid: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid student_status", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "mahasiswa",
      paid: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts minimal row (only name, umum status)", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      paid: false,
    });

    expect(result.success).toBe(true);
  });

  it("accepts row with optional wa_number and email omitted (undefined)", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      paid: true,
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty strings for wa_number and email", () => {
    const result = importRowSchema.safeParse({
      full_name: "Budi",
      student_status: "umum",
      wa_number: "",
      email: "",
      paid: false,
    });

    expect(result.success).toBe(true);
  });
});
