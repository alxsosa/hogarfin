import { z } from "zod";

export const accountTypeEnum = z.enum([
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "retirement",
  "loan",
  "mortgage",
  "other_asset",
  "other_liability",
]);

export type AccountType = z.infer<typeof accountTypeEnum>;

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  householdId: z.string().uuid(),
  name: z.string().min(2, "Ingresa un nombre para la cuenta"),
  type: accountTypeEnum,
  institution: z.string().optional(),
  currency: z
    .string()
    .length(3, "Usa el código de 3 letras, ej. MXN")
    .default("MXN"),
  currentBalance: z.coerce.number({
    message: "Ingresa un saldo válido",
  }),
  creditLimit: z.coerce.number().min(0).optional(),
  interestRate: z.coerce.number().min(0).optional(),
  statementDate: z.coerce.number().int().min(1).max(31).optional(),
  dueDate: z.coerce.number().int().min(1).max(31).optional(),
  notes: z.string().optional(),
});

export type AccountInput = z.infer<typeof accountSchema>;
