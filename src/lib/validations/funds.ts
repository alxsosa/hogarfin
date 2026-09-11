import { z } from "zod";

function emptyToUndefined(v: unknown) {
  return v === null || v === undefined || v === "" ? undefined : v;
}

const optionalAmount = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "Debe ser un monto positivo").optional()
);

const optionalDate = z.preprocess(
  emptyToUndefined,
  z.string().optional()
);

export const createFundSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1, "Ingresa un nombre"),
  goalAmount: z.coerce.number().min(0, "Debe ser un monto positivo"),
  currentBalance: z.coerce.number().min(0, "Debe ser un monto positivo").default(0),
  targetDate: optionalDate,
  monthlyContribution: optionalAmount,
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const updateFundSchema = createFundSchema.extend({
  id: z.string().uuid(),
});

export const goalTypeValues = [
  "savings",
  "emergency_fund",
  "purchase",
  "debt_free",
  "investment",
  "custom",
] as const;

export const goalTypeLabels: Record<(typeof goalTypeValues)[number], string> = {
  savings: "Ahorro",
  emergency_fund: "Fondo de emergencia",
  purchase: "Compra",
  debt_free: "Libre de deudas",
  investment: "Inversión",
  custom: "Personalizado",
};

export const createGoalSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1, "Ingresa un nombre"),
  type: z.enum(goalTypeValues).default("custom"),
  targetAmount: z.coerce.number().min(0, "Debe ser un monto positivo"),
  currentAmount: z.coerce.number().min(0, "Debe ser un monto positivo").default(0),
  targetDate: optionalDate,
  priority: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().optional()
  ),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().uuid(),
});

export const debtStrategyValues = ["snowball", "avalanche", "custom"] as const;

export const debtStrategyLabels: Record<(typeof debtStrategyValues)[number], string> = {
  snowball: "Bola de nieve",
  avalanche: "Avalancha",
  custom: "Personalizada",
};

export const createDebtSchema = z.object({
  householdId: z.string().uuid(),
  creditor: z.string().min(1, "Ingresa el acreedor"),
  originalBalance: z.coerce.number().min(0, "Debe ser un monto positivo"),
  currentBalance: z.coerce.number().min(0, "Debe ser un monto positivo"),
  interestRate: optionalAmount,
  minimumPayment: optionalAmount,
  plannedPayment: optionalAmount,
  strategy: z.preprocess(
    emptyToUndefined,
    z.enum(debtStrategyValues).optional()
  ),
  dueDate: optionalDate,
});

export const updateDebtSchema = createDebtSchema.extend({
  id: z.string().uuid(),
});

export const contributeSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive("Ingresa un monto mayor a 0"),
});

export type CreateFundInput = z.infer<typeof createFundSchema>;
export type UpdateFundInput = z.infer<typeof updateFundSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type ContributeInput = z.infer<typeof contributeSchema>;
