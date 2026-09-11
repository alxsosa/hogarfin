import { z } from "zod";

function emptyToUndefined(v: unknown) {
  return v === null || v === undefined || v === "" ? undefined : v;
}

const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().optional());

export const billFrequencyValues = [
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
  "custom",
] as const;

export const billFrequencyLabels: Record<(typeof billFrequencyValues)[number], string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
  custom: "Personalizada",
};

export const createBillSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1, "Ingresa un nombre"),
  amount: z.coerce.number().positive("Debe ser un monto positivo"),
  frequency: z.enum(billFrequencyValues).default("monthly"),
  nextDueDate: optionalDate,
  autoPay: z.coerce.boolean().default(false),
  reminderDaysBefore: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).default(3)
  ),
  categoryId: optionalUuid,
  accountId: optionalUuid,
  notes: optionalText,
});

export const updateBillSchema = createBillSchema.extend({
  id: z.string().uuid(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
