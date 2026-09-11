import { z } from "zod";

export const createTransactionSchema = z.object({
  householdId: z.string().uuid(),
  date: z.string().min(1, "Elige una fecha"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  accountId: z.string().uuid("Elige una cuenta"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1, "Ingresa una descripción"),
  merchant: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const createCategorySchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1, "Ingresa un nombre"),
  parentId: z.string().uuid().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/** Parses the comma-separated tags string from the form into a clean array. */
export function parseTags(tags: string | undefined | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
