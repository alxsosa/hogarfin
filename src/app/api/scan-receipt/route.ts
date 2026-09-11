import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import { receiptScanResultSchema } from "@/lib/validations/receipt-scan";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a phone photo

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// A single forced tool call is how we get reliable structured JSON back
// from the Messages API directly (the AI SDK's generateObject does the
// same thing under the hood, but this project calls Anthropic directly
// rather than through Vercel AI Gateway — see the route's doc comment).
const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_receipt",
  description: "Extrae los datos estructurados de un ticket/recibo de compra.",
  input_schema: {
    type: "object",
    properties: {
      merchant: { type: ["string", "null"], description: "Nombre del comercio, o null si no es legible." },
      amount: { type: ["number", "null"], description: "El TOTAL pagado (no subtotales/cambio), como número positivo." },
      date: { type: ["string", "null"], description: "Fecha del ticket en formato YYYY-MM-DD, o null si no es legible." },
      suggestedCategoryId: { type: ["string", "null"], description: "El id exacto de la lista de categorías dadas, o null." },
      suggestedCategoryName: { type: ["string", "null"] },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      notes: { type: ["string", "null"], description: "Nota breve en español si algo no se leyó bien, o null." },
    },
    required: ["merchant", "amount", "date", "suggestedCategoryId", "suggestedCategoryName", "confidence", "notes"],
  },
};

/**
 * Reads a photographed receipt/ticket and extracts merchant, amount,
 * date, and a suggested category — matched against the household's own
 * real categories (never invented) so the result can be used directly to
 * pre-fill the "Nueva transacción" form. This never creates a
 * transaction itself — the "AI proposes, user approves" principle from
 * the original product brief.
 *
 * Calls the Anthropic API directly (not through Vercel AI Gateway) —
 * this Vercel project's plan restricts every Claude model behind the
 * gateway to paid AI Gateway credits, so ANTHROPIC_API_KEY is used
 * instead. Auth for this route itself follows the same model as every
 * other (app) route: proxy.ts redirects unauthenticated requests before
 * this handler runs, and getUserHouseholds() only returns households the
 * caller actually belongs to (RLS-scoped).
 */
export async function POST(req: NextRequest) {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) {
    return NextResponse.json({ error: "No perteneces a ningún hogar." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado grande (máx. 8MB)." }, { status: 400 });
  }

  const categories = await getHouseholdCategories(active.id);
  // Only leaf categories are assignable to a transaction (same convention
  // as budget lines and rules), so that's what we offer Claude to choose
  // from — a category id it returns must be one of these, never invented.
  const leafCategories = categories.filter((c) => c.parentId);
  const categoryList = leafCategories
    .map((c) => `- ${c.id}: ${c.name}`)
    .join("\n");

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  try {
    const message = await client.messages.create({
      // Haiku 4.5 — cheapest current Claude model with vision. Receipt
      // extraction is a simple, bounded task that doesn't need a bigger
      // model, and this keeps token spend low on every scan.
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_receipt" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Lee este ticket/recibo de compra y extrae la información con la herramienta extract_receipt. Hoy es ${new Date().toISOString().slice(0, 10)}.

Estas son las categorías reales del hogar — suggestedCategoryId debe ser EXACTAMENTE uno de estos ids, o null si ninguna aplica bien:
${categoryList || "(el hogar no tiene categorías configuradas todavía)"}`,
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: "No se pudo leer el ticket. Intenta con otra foto." },
        { status: 502 }
      );
    }

    const parsed = receiptScanResultSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      console.error("scan-receipt: schema mismatch", parsed.error, toolUse.input);
      return NextResponse.json(
        { error: "No se pudo leer el ticket. Intenta con otra foto." },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: parsed.data });
  } catch (error) {
    console.error("scan-receipt failed:", error);
    return NextResponse.json(
      { error: "No se pudo leer el ticket. Intenta con otra foto." },
      { status: 502 }
    );
  }
}
