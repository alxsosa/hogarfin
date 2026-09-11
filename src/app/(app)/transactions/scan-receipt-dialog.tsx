"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionForm } from "./transaction-form";
import type { AccountOption, CategoryRow } from "@/features/transactions/data";
import type { ReceiptScanResult } from "@/lib/validations/receipt-scan";

type Step = "idle" | "uploading" | "review" | "error";

export function ScanReceiptDialog({
  householdId,
  accounts,
  categories,
}: {
  householdId: string;
  accounts: AccountOption[];
  categories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("idle");
    setError(null);
    setResult(null);
    setPreview(null);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStep("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("image", file);

    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo leer el ticket.");
        setStep("error");
        return;
      }

      setResult(data.result as ReceiptScanResult);
      setStep("review");
    } catch {
      setError("No se pudo conectar con el servicio. Intenta de nuevo.");
      setStep("error");
    } finally {
      // Allow re-selecting the same file later.
      e.target.value = "";
    }
  }

  const matchedCategory = result?.suggestedCategoryId
    ? categories.find((c) => c.id === result.suggestedCategoryId)
    : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Camera />
        Escanear ticket
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear ticket</DialogTitle>
          <DialogDescription>
            Toma o sube una foto del recibo — HogarFin lee el monto, el
            comercio y sugiere una categoría. Tú confirmas antes de
            guardar.
          </DialogDescription>
        </DialogHeader>

        {step === "idle" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera />
              Tomar o elegir foto
            </Button>
          </div>
        )}

        {step === "uploading" && (
          <div className="flex flex-col items-center gap-3 py-10">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Ticket"
                className="max-h-40 rounded-lg border object-contain"
              />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Leyendo el ticket...
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={reset}>
              Intentar de nuevo
            </Button>
          </div>
        )}

        {step === "review" && result && (
          <div className="space-y-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Ticket"
                className="mx-auto max-h-32 rounded-lg border object-contain"
              />
            )}

            {result.confidence === "low" && (
              <Alert>
                <AlertDescription>
                  No estoy muy seguro de haber leído bien el ticket —
                  revisa los datos antes de guardar.
                </AlertDescription>
              </Alert>
            )}
            {result.notes && (
              <p className="text-xs text-muted-foreground">{result.notes}</p>
            )}

            <TransactionForm
              householdId={householdId}
              accounts={accounts}
              categories={categories}
              onSuccess={() => setOpen(false)}
              defaultValues={{
                amount: result.amount ?? undefined,
                date: result.date ?? undefined,
                description: result.merchant
                  ? `Compra en ${result.merchant}`
                  : undefined,
                merchant: result.merchant ?? undefined,
                categoryId: matchedCategory?.id,
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
