import { z } from "zod";

export const setBudgetLineSchema = z.object({
  householdId: z.string().uuid(),
  periodMonth: z.string(), // "YYYY-MM-01"
  categoryId: z.string().uuid(),
  budgetedAmount: z.coerce.number().min(0, "No puede ser negativo"),
  rollover: z.coerce.boolean().optional().default(false),
});

export type SetBudgetLineInput = z.infer<typeof setBudgetLineSchema>;
