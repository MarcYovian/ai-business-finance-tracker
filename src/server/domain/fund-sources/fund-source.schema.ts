import { z } from "zod";

export const createFundSourceSchema = z.object({
  name: z.string().min(1, "Nama akun/rekening wajib diisi."),
  type: z.enum(["bank", "cash", "e-wallet", "credit_card"], {
    errorMap: () => ({ message: "Tipe akun harus 'bank', 'cash', 'e-wallet', atau 'credit_card'." }),
  }),
  balance: z.number().nonnegative("Saldo awal tidak boleh negatif.").default(0),
  accountNumber: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  cardExpiry: z.string().nullable().optional(),
  colorTheme: z.string().optional().default("lime"),
  isActive: z.boolean().optional().default(true),
});

export const updateFundSourceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["bank", "cash", "e-wallet", "credit_card"]).optional(),
  accountNumber: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  cardExpiry: z.string().nullable().optional(),
  colorTheme: z.string().optional(),
  isActive: z.boolean().optional(),
});
