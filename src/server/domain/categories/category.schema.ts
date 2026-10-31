import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi."),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipe kategori harus 'income' atau 'expense'." }),
  }),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["income", "expense"]).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});
