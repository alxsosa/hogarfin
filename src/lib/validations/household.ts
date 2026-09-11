import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().min(2, "Ingresa un nombre para tu hogar"),
  currency: z.enum(["MXN", "USD", "EUR"]).default("MXN"),
});

export const inviteMemberSchema = z.object({
  householdId: z.string().uuid(),
  email: z.string().email("Correo inválido"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
