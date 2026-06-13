import { z } from "zod";

export const tournamentCodeSchema = z
  .string()
  .min(3, "Kode turnamen minimal 3 karakter")
  .max(50, "Kode turnamen maksimal 50 karakter")
  .regex(/^[a-z0-9_]+$/, "Kode hanya boleh berisi huruf kecil, angka, dan underscore");

export const registrationSchema = z
  .object({
    full_name: z.string().min(1, "Nama lengkap wajib diisi").max(100),
    email: z.string().email("Format email tidak valid"),
    student_status: z.enum(["pelajar", "umum"], {
      errorMap: () => ({ message: "Status harus pelajar atau umum" }),
    }),
    school_name: z.string().max(100).optional(),
    wa_number: z
      .string()
      .min(10, "Nomor WA minimal 10 digit")
      .max(15, "Nomor WA maksimal 15 digit"),
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
