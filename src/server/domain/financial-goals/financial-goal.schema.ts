import { z } from "zod";

export const upsertFinancialGoalSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Nama target finansial wajib diisi."),
    description: z.string().nullable().optional(),
    targetAmount: z.number().positive().optional(),
    target_amount: z.number().positive().optional(),
    currentAmount: z.number().nonnegative().optional(),
    current_amount: z.number().nonnegative().optional(),
    category: z.enum(["savings", "investment", "debt_payoff", "other"]).optional().default("savings"),
    targetDate: z.string().optional(),
    target_date: z.string().optional(),
    status: z.enum(["active", "completed", "cancelled"]).optional().default("active"),
    priority: z.number().int().optional().default(0),
  })
  .transform((data) => {
    const targetAmount = data.targetAmount ?? data.target_amount ?? 0;
    const currentAmount = data.currentAmount ?? data.current_amount ?? 0;
    const targetDate = data.targetDate || data.target_date || new Date().toISOString().split("T")[0];

    return {
      id: data.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      targetAmount,
      currentAmount,
      category: data.category,
      targetDate,
      status: data.status,
      priority: data.priority,
    };
  })
  .refine((data) => data.targetAmount > 0, {
    message: "Nominal target dana (target_amount) harus lebih dari 0.",
    path: ["targetAmount"],
  });
