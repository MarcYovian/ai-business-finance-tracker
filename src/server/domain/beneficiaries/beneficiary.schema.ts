import { z } from "zod";

export const createBeneficiarySchema = z
  .object({
    name: z.string().min(1, "Nama kontak penerima wajib diisi."),
    bankName: z.string().optional(),
    bank_name: z.string().optional(),
    accountNumber: z.string().optional(),
    account_number: z.string().optional(),
    accountType: z.enum(["bank", "ewallet"]).optional(),
    account_type: z.enum(["bank", "ewallet"]).optional(),
    notes: z.string().nullable().optional(),
  })
  .transform((data) => ({
    name: data.name.trim(),
    bankName: (data.bankName || data.bank_name || "").trim(),
    accountNumber: (data.accountNumber || data.account_number || "").trim(),
    accountType: (data.accountType || data.account_type || "bank") as "bank" | "ewallet",
    notes: data.notes?.trim() || null,
  }))
  .refine((data) => data.bankName.length > 0, {
    message: "Nama bank atau e-wallet wajib diisi.",
    path: ["bankName"],
  })
  .refine((data) => data.accountNumber.length > 0, {
    message: "Nomor rekening atau nomor telepon e-wallet wajib diisi.",
    path: ["accountNumber"],
  });
