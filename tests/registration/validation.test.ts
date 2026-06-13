import { describe, it, expect } from "vitest";
import { generateRegistrationId, currentYear } from "@/lib/utils/helpers";
import {
  tournamentCodeSchema,
  registrationSchema,
} from "@/lib/validation/schemas";

describe("generateRegistrationId", () => {
  it("generates ID in format CATUR{YYYY}-{SEQ}", () => {
    expect(generateRegistrationId(2026, 1)).toBe("CATUR2026-001");
  });

  it("pads sequence to 3 digits", () => {
    expect(generateRegistrationId(2026, 42)).toBe("CATUR2026-042");
    expect(generateRegistrationId(2026, 999)).toBe("CATUR2026-999");
  });
});

describe("currentYear", () => {
  it("returns current year as number", () => {
    const year = currentYear();
    expect(typeof year).toBe("number");
    expect(year).toBeGreaterThanOrEqual(2025);
  });
});

describe("tournamentCodeSchema", () => {
  it("accepts valid lowercase codes", () => {
    expect(tournamentCodeSchema.parse("sumedang_open_2026")).toBe(
      "sumedang_open_2026",
    );
  });

  it("rejects uppercase letters", () => {
    expect(() => tournamentCodeSchema.parse("Sumedang_Open")).toThrow();
  });

  it("rejects special characters", () => {
    expect(() => tournamentCodeSchema.parse("sumedang-open")).toThrow();
  });

  it("rejects codes shorter than 3 chars", () => {
    expect(() => tournamentCodeSchema.parse("ab")).toThrow();
  });
});

describe("registrationSchema", () => {
  const validRegistration = {
    full_name: "Budi Santoso",
    email: "budi@example.com",
    student_status: "umum" as const,
    wa_number: "081234567890",
    tournament_code: "sumedang_open_2026",
  };

  it("accepts valid registration", () => {
    const result = registrationSchema.parse(validRegistration);
    expect(result.full_name).toBe("Budi Santoso");
  });

  it("rejects missing full_name", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, full_name: "" }),
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, email: "not-email" }),
    ).toThrow();
  });

  it("requires school_name when student_status is pelajar", () => {
    const pelajar = { ...validRegistration, student_status: "pelajar" as const };
    expect(() => registrationSchema.parse(pelajar)).toThrow();

    const withSchool = { ...pelajar, school_name: "SMA Negeri 1" };
    expect(registrationSchema.parse(withSchool).school_name).toBe(
      "SMA Negeri 1",
    );
  });

  it("accepts optional chess_rating", () => {
    const withRating = { ...validRegistration, chess_rating: 1800 };
    expect(registrationSchema.parse(withRating).chess_rating).toBe(1800);
  });

  it("rejects negative chess_rating", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, chess_rating: -1 }),
    ).toThrow();
  });

  it("rejects chess_rating above 3000", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, chess_rating: 3001 }),
    ).toThrow();
  });

  it("rejects invalid student_status", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, student_status: "mahasiswa" }),
    ).toThrow();
  });

  it("rejects short wa_number", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, wa_number: "0812" }),
    ).toThrow();
  });

  it("rejects wa_number with non-digit characters", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, wa_number: "0812-3456-7890" }),
    ).toThrow();
  });

  it("rejects empty tournament_code", () => {
    expect(() =>
      registrationSchema.parse({ ...validRegistration, tournament_code: "" }),
    ).toThrow();
  });
});

describe("registrationSchema — pelajar rules", () => {
  const base = {
    full_name: "Ani",
    email: "ani@school.id",
    student_status: "pelajar" as const,
    wa_number: "081234567890",
    tournament_code: "sd_open_2026",
  };

  it("rejects pelajar without school_name", () => {
    expect(() => registrationSchema.parse(base)).toThrow();
  });

  it("accepts pelajar with school_name", () => {
    expect(
      registrationSchema.parse({ ...base, school_name: "SD Negeri 1" }).school_name,
    ).toBe("SD Negeri 1");
  });
});

describe("tournamentCodeSchema — edge cases", () => {
  it("accepts code with only letters", () => {
    expect(tournamentCodeSchema.parse("sumedangopen")).toBe("sumedangopen");
  });

  it("accepts code with numbers only", () => {
    expect(tournamentCodeSchema.parse("2026")).toBe("2026");
  });

  it("rejects empty string", () => {
    expect(() => tournamentCodeSchema.parse("")).toThrow();
  });

  it("rejects code with spaces", () => {
    expect(() => tournamentCodeSchema.parse("sumedang open")).toThrow();
  });

  it("accepts minimum 3 char code", () => {
    expect(tournamentCodeSchema.parse("abc")).toBe("abc");
  });
});

describe("generateRegistrationId — edge cases", () => {
  it("handles single-digit sequence", () => {
    expect(generateRegistrationId(2025, 5)).toBe("CATUR2025-005");
  });

  it("handles sequence above 999", () => {
    expect(generateRegistrationId(2025, 1000)).toBe("CATUR2025-1000");
  });
});
