import { z } from "zod";

const fullNameRule = z.string().min(1, "Nama lengkap wajib diisi").max(100);
const emailRule = z
  .string()
  .email("Format email tidak valid")
  .optional()
  .or(z.literal("").transform(() => undefined));
const studentStatusRule = z.enum(["pelajar", "umum"], {
  errorMap: () => ({ message: "Status harus pelajar atau umum" }),
});
const schoolNameRule = z.string().max(100).optional();
const waNumberRule = z
  .string()
  .regex(/^[0-9]+$/, "Nomor WA hanya boleh berisi angka")
  .min(10, "Nomor WA minimal 10 digit")
  .max(15, "Nomor WA maksimal 15 digit");
const waNumberOptionalRule = waNumberRule
  .optional()
  .or(z.literal("").transform(() => undefined));

export const tournamentCodeSchema = z
  .string()
  .min(3, "Kode turnamen minimal 3 karakter")
  .max(50, "Kode turnamen maksimal 50 karakter")
  .regex(/^[a-z0-9_]+$/, "Kode hanya boleh berisi huruf kecil, angka, dan underscore");

export const registrationSchema = z
  .object({
    full_name: fullNameRule,
    email: emailRule,
    student_status: studentStatusRule,
    school_name: schoolNameRule,
    wa_number: waNumberRule,
    tournament_code: tournamentCodeSchema,
    chess_rating: z
      .number()
      .int("Rating harus bilangan bulat")
      .min(0, "Rating tidak boleh negatif")
      .max(3000, "Rating maksimal 3000")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.student_status === "pelajar") {
        return !!data.school_name;
      }
      return true;
    },
    {
      message: "Nama sekolah wajib diisi untuk pelajar",
      path: ["school_name"],
    },
  );

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const importRowSchema = z
  .object({
    full_name: fullNameRule,
    student_status: studentStatusRule,
    school_name: schoolNameRule,
    wa_number: waNumberOptionalRule,
    email: emailRule,
    paid: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.student_status === "pelajar") {
        return !!data.school_name;
      }
      return true;
    },
    {
      message: "Nama sekolah wajib diisi untuk pelajar",
      path: ["school_name"],
    },
  );

export type ImportRowInput = z.infer<typeof importRowSchema>;

// ─── Chess-Results.com Import Schemas ───────────────────────────────

export const chessResultsPlayerSchema = z.object({
  startNo: z.number().int().positive(),
  name: z.string().min(1),
  federation: z.string().optional(),
  rating: z.number().int().min(0).optional(),
  club: z.string().optional(),
});

export const chessResultsPairingSchema = z.object({
  table: z.number().int().positive(),
  whiteName: z.string().min(1),
  blackName: z.string(),
  result: z.string().optional(),
});

export const chessResultsMetaSchema = z.object({
  name: z.string().min(1),
  federation: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rounds: z.number().int().min(1),
  arbiter: z.string().optional(),
  city: z.string().optional(),
});

export const chessResultsUrlSchema = z.string().url().regex(
  /^https?:\/\/(?:[\w-]+\.)?chess-results\.com\/tnr\d+/i,
  "URL harus dari chess-results.com (format: chess-results.com/tnr...)",
);

export const importChessResultsSchema = z.object({
  url: chessResultsUrlSchema,
  tournamentId: z.string().min(1, "ID turnamen wajib diisi"),
});

export type ChessResultsPlayerInput = z.infer<typeof chessResultsPlayerSchema>;
export type ChessResultsPairingInput = z.infer<typeof chessResultsPairingSchema>;
export type ChessResultsMetaInput = z.infer<typeof chessResultsMetaSchema>;
export type ImportChessResultsInput = z.infer<typeof importChessResultsSchema>;
