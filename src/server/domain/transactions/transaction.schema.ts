import { z } from "zod";

export const listTransactionsSchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sourceFundId: z.string().uuid().optional(),
  destinationFundId: z.string().uuid().optional(),
});

export const createTransactionSchema = z
  .object({
    description: z.string().min(1, "Deskripsi transaksi wajib diisi."),
    amount: z.number().positive("Nominal transaksi harus lebih dari 0."),
    type: z.enum(["income", "expense", "transfer"], {
      errorMap: () => ({ message: "Tipe transaksi harus 'income', 'expense', atau 'transfer'." }),
    }),
    transactionDate: z.string().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    sourceFundId: z.string().uuid().nullable().optional(),
    destinationFundId: z.string().uuid().nullable().optional(),
    fee: z.number().nonnegative("Biaya admin tidak boleh negatif.").optional().default(0),
    notes: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "expense" || data.type === "transfer") && !data.sourceFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceFundId"],
        message: `Akun sumber dana (sourceFundId) wajib diisi untuk transaksi ${data.type}.`,
      });
    }

    if ((data.type === "income" || data.type === "transfer") && !data.destinationFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationFundId"],
        message: `Akun tujuan (destinationFundId) wajib diisi untuk transaksi ${data.type}.`,
      });
    }

    if (data.type === "transfer" && data.sourceFundId === data.destinationFundId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationFundId"],
        message: "Akun sumber dan akun tujuan tidak boleh sama pada transaksi transfer.",
      });
    }
  });

export const updateTransactionSchema = z.object({
  id: z.string().uuid("ID transaksi harus berupa UUID valid."),
  description: z.string().min(1).optional(),
  amount: z.number().positive("Nominal transaksi harus lebih dari 0.").optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  transactionDate: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  sourceFundId: z.string().uuid().nullable().optional(),
  destinationFundId: z.string().uuid().nullable().optional(),
  fee: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});
