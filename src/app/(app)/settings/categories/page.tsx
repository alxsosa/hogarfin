import { redirect } from "next/navigation";
import { getUserHouseholds } from "@/features/households/data";
import { getHouseholdCategories } from "@/features/transactions/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { AddCategoryForm } from "./add-category-form";

export default async function CategoriesPage() {
  const households = await getUserHouseholds();
  const active = households[0];
  if (!active) redirect("/onboarding");

  const categories = await getHouseholdCategories(active.id);
  const groups = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description={`Organiza los grupos y subcategorías de ${active.name}.`}
      />

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Agregar categoría</CardTitle>
          <CardDescription>
            Se agrega como subcategoría del grupo elegido, o como grupo nuevo
            si no eliges ninguno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddCategoryForm householdId={active.id} groups={groups} />
        </CardContent>
      </Card>

      <Card className="ring-1 ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Todas las categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.map((group) => {
            const children = categories.filter((c) => c.parentId === group.id);
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {group.color && (
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <span className="font-medium">
                    {group.icon ? `${group.icon} ` : ""}
                    {group.name}
                  </span>
                </div>
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {children.map((c) => (
                      <Badge key={c.id} variant="outline">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
