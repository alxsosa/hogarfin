"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { FundRow, GoalRow } from "@/features/funds/data";
import { FundCard } from "./fund-card";
import { GoalCard } from "./goal-card";
import { CreateFundDialog } from "./create-fund-dialog";
import { CreateGoalDialog } from "./create-goal-dialog";
import { EditFundDialog } from "./edit-fund-dialog";
import { EditGoalDialog } from "./edit-goal-dialog";

export function FundsGoalsTabs({
  householdId,
  currency,
  funds,
  goals,
}: {
  householdId: string;
  currency: string;
  funds: FundRow[];
  goals: GoalRow[];
}) {
  const [tab, setTab] = useState("funds");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<FundRow | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);

  const handleEditFund = useCallback((fund: FundRow) => {
    setEditingFund(fund);
  }, []);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="funds">Fondos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          {tab === "funds" ? "Nuevo fondo" : "Nueva meta"}
        </Button>
      </div>

      <TabsContent value="funds" className="mt-4">
        {funds.length === 0 ? (
          <EmptyState label="Aún no tienes fondos de ahorro. Crea uno para empezar a apartar dinero con un propósito." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund) => (
              <FundCard key={fund.id} fund={fund} currency={currency} onEdit={handleEditFund} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="goals" className="mt-4">
        {goals.length === 0 ? (
          <EmptyState label="Aún no tienes metas. Define una meta para darle rumbo a tus ahorros." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} currency={currency} onEdit={(g) => setEditingGoal(g)} />
            ))}
          </div>
        )}
      </TabsContent>

      {tab === "funds" ? (
        <>
          <CreateFundDialog
            householdId={householdId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
          {editingFund && (
            <EditFundDialog
              fund={editingFund}
              open={!!editingFund}
              onOpenChange={(open) => {
                if (!open) setEditingFund(null);
              }}
            />
          )}
        </>
      ) : (
        <>
          <CreateGoalDialog
            householdId={householdId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
          {editingGoal && (
            <EditGoalDialog
              goal={editingGoal}
              open={!!editingGoal}
              onOpenChange={(open) => {
                if (!open) setEditingGoal(null);
              }}
            />
          )}
        </>
      )}
    </Tabs>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
