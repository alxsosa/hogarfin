"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  createHousehold,
  inviteMember,
} from "@/features/households/actions";
import { createAccount } from "@/features/accounts/actions";
import { createIncomeSource } from "@/features/income/actions";
import {
  setBudgetLine,
  getCategoriesForBudgetStep,
} from "@/features/budget/actions";
import { periodMonthKey } from "@/features/budget/period";
import { StepHousehold } from "./steps/step-household";
import { StepInvite } from "./steps/step-invite";
import { StepAccounts, type DraftAccount } from "./steps/step-accounts";
import { StepIncome, type DraftIncome } from "./steps/step-income";
import { StepBudget, type DraftBudgetLine } from "./steps/step-budget";
import { StepDone } from "./steps/step-done";
import { OnboardingProgress } from "./onboarding-progress";

export type CategoryOption = { id: string; name: string };

const TOTAL_STEPS = 6;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("MXN");
  const [categories, setCategories] = useState<CategoryOption[] | null>(null);

  useEffect(() => {
    if (step !== 5 || !householdId || categories !== null) return;
    let cancelled = false;
    getCategoriesForBudgetStep(householdId).then((result) => {
      if (!cancelled) setCategories(result);
    });
    return () => {
      cancelled = true;
    };
  }, [step, householdId, categories]);

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleHouseholdCreated(id: string, curr: string) {
    setHouseholdId(id);
    setCurrency(curr);
    next();
  }

  function handleInvite(email: string) {
    if (!householdId) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("householdId", householdId);
      fd.set("email", email);
      fd.set("role", "MEMBER");
      const result = await inviteMember(null, fd);
      if (result?.error || result?.fieldErrors) {
        toast.error(
          result.error ?? result.fieldErrors?.email?.[0] ?? "No se pudo enviar la invitación."
        );
        return;
      }
      toast.success("Invitación enviada.");
      next();
    });
  }

  function handleAccounts(accounts: DraftAccount[]) {
    if (!householdId) return;
    startTransition(async () => {
      for (const account of accounts) {
        const fd = new FormData();
        fd.set("householdId", householdId);
        fd.set("name", account.name);
        fd.set("type", account.type);
        fd.set("currency", currency);
        fd.set("currentBalance", String(account.currentBalance));
        const result = await createAccount(null, fd);
        if (result?.error || result?.fieldErrors) {
          toast.error(
            result.error ?? `No se pudo guardar la cuenta "${account.name}".`
          );
          return;
        }
      }
      next();
    });
  }

  function handleIncome(sources: DraftIncome[]) {
    if (!householdId) return;
    startTransition(async () => {
      for (const source of sources) {
        const fd = new FormData();
        fd.set("householdId", householdId);
        fd.set("name", source.name);
        fd.set("expectedAmount", String(source.expectedAmount));
        fd.set("frequency", source.frequency);
        const result = await createIncomeSource(null, fd);
        if (result?.error || result?.fieldErrors) {
          toast.error(
            result.error ?? `No se pudo guardar el ingreso "${source.name}".`
          );
          return;
        }
      }
      next();
    });
  }

  function handleBudget(lines: DraftBudgetLine[]) {
    if (!householdId) return;
    startTransition(async () => {
      const periodMonth = periodMonthKey();
      for (const line of lines) {
        const fd = new FormData();
        fd.set("householdId", householdId);
        fd.set("periodMonth", periodMonth);
        fd.set("categoryId", line.categoryId);
        fd.set("budgetedAmount", String(line.budgetedAmount));
        const result = await setBudgetLine(null, fd);
        if (result?.error || result?.fieldErrors) {
          toast.error(
            result.error ?? `No se pudo asignar "${line.categoryName}".`
          );
          return;
        }
      }
      next();
    });
  }

  function finish() {
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/brand/oikos-logo-full.png"
          alt="Oikos — Casa Próspera"
          width={1086}
          height={455}
          className="w-56"
          priority
        />
      </div>

      <OnboardingProgress current={step} total={TOTAL_STEPS} />

      <div className="relative mt-6 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-primary/70" />
        <div className="p-6">
          {step === 1 && (
            <StepHousehold
              pending={isPending}
              onCreated={handleHouseholdCreated}
              createHousehold={createHousehold}
            />
          )}
          {step === 2 && (
            <StepInvite
              pending={isPending}
              onInvite={handleInvite}
              onSkip={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <StepAccounts
              pending={isPending}
              currency={currency}
              onSubmit={handleAccounts}
              onSkip={next}
              onBack={back}
            />
          )}
          {step === 4 && (
            <StepIncome
              pending={isPending}
              currency={currency}
              onSubmit={handleIncome}
              onSkip={next}
              onBack={back}
            />
          )}
          {step === 5 && (
            <StepBudget
              pending={isPending || categories === null}
              currency={currency}
              categories={categories ?? []}
              onSubmit={handleBudget}
              onSkip={next}
              onBack={back}
            />
          )}
          {step === 6 && <StepDone onFinish={finish} />}
        </div>
      </div>

      {step > 1 && step < 6 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Puedes completar esta información después desde Configuración.
        </p>
      )}
    </div>
  );
}
