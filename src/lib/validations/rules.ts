import { z } from "zod";

export const matchFieldValues = ["description", "merchant", "amount"] as const;
export const matchFieldLabels: Record<(typeof matchFieldValues)[number], string> = {
  description: "Descripción",
  merchant: "Comercio",
  amount: "Monto",
};

export const matchTypeValues = [
  "contains",
  "starts_with",
  "ends_with",
  "equals",
  "amount_gt",
  "amount_lt",
] as const;
export const matchTypeLabels: Record<(typeof matchTypeValues)[number], string> = {
  contains: "Contiene",
  starts_with: "Empieza con",
  ends_with: "Termina con",
  equals: "Es igual a",
  amount_gt: "Monto mayor a",
  amount_lt: "Monto menor a",
};

/**
 * v1 only implements the 'categorize' action end-to-end (assign a
 * category on transaction create). The schema (0006_bills_income_audit_rules.sql)
 * also allows tag/flag/split/ignore/convert_to_transfer for future
 * phases — not built yet, so the UI only offers 'categorize' for now.
 */
export const createRuleSchema = z
  .object({
    householdId: z.string().uuid(),
    name: z.string().optional(),
    matchField: z.enum(matchFieldValues),
    matchType: z.enum(matchTypeValues),
    matchValue: z.string().min(1, "Ingresa un valor a buscar"),
    categoryId: z.string().uuid("Selecciona una categoría"),
    priority: z.coerce.number().int().optional().default(0),
  })
  .refine(
    (data) =>
      data.matchField !== "amount" ||
      data.matchType === "amount_gt" ||
      data.matchType === "amount_lt" ||
      data.matchType === "equals",
    {
      message: "Para 'Monto' usa 'Monto mayor a', 'Monto menor a' o 'Es igual a'.",
      path: ["matchType"],
    }
  );

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
