import { z } from "zod";

export const upsertBudgetSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal awal harus YYYY-MM-DD."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal akhir harus YYYY-MM-DD."),
  name: z.string().min(1, "Nama anggaran wajib diisi."),
  items: z.array(
    z.object({
      categoryId: z.string().uuid("Category ID harus berupa UUID valid."),
      amount: z.number().nonnegative("Nominal alokasi anggaran tidak boleh negatif."),
    })
  ),
});
