import { z } from "zod";

/** Structured shape Claude must return when reading a receipt photo.
 * merchant/amount/date are the ticket's own fields; suggestedCategoryId
 * is Claude's best guess matched against the household's real category
 * list (passed in the prompt) — never invented, always one of the ids
 * we gave it, or null if nothing fits. */
export const receiptScanResultSchema = z.object({
  merchant: z.string().nullable(),
  amount: z.number().nullable(),
  date: z.string().nullable(), // "YYYY-MM-DD" if legible, else null
  suggestedCategoryId: z.string().nullable(),
  suggestedCategoryName: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().nullable(), // e.g. "No pude leer el total con claridad"
});

export type ReceiptScanResult = z.infer<typeof receiptScanResultSchema>;
