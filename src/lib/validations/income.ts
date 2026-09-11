import { z } from "zod";

function emptyToUndefined(v: unknown) {
  return v === null || v === undefined || v === "" ? undefined : v;
}

const optionalAmount = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "Debe ser un monto positivo").optional()
);

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid().optional()
);

const optionalText = z.preprocess(emptyToUndefined, z.string().optional());

export const incomeFrequencyValues = [
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
  "custom",
] as const;

export const incomeFrequencyLabels: Record<
  (typeof incomeFrequencyValues)[number],
  string
> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
  custom: "Personalizada",
};

export const createIncomeSourceSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1, "Ingresa un nombre"),
  expectedAmount: optionalAmount,
  frequency: z.enum(incomeFrequencyValues).default("monthly"),
  accountId: optionalUuid,
  categoryId: optionalUuid,
  notes: optionalText,
});

export const updateIncomeSourceSchema = createIncomeSourceSchema.extend({
  id: z.string().uuid(),
});

export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>;
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>;
