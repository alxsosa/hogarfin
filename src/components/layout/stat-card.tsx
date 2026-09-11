import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneStyles = {
  default: {
    bar: "from-primary to-primary/70",
    iconWrap: "bg-primary/10",
    icon: "text-primary",
    hoverRing: "hover:ring-primary/25",
  },
  info: {
    bar: "from-[#6b8fb9] to-[#8ba8c9]",
    iconWrap: "bg-[#6b8fb9]/10",
    icon: "text-[#6b8fb9]",
    hoverRing: "hover:ring-[#6b8fb9]/25",
  },
  danger: {
    bar: "from-destructive to-destructive/70",
    iconWrap: "bg-destructive/10",
    icon: "text-destructive",
    hoverRing: "hover:ring-destructive/25",
  },
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
  hint?: React.ReactNode;
  className?: string;
}) {
  const t = toneStyles[tone];

  return (
    <Card
      className={cn(
        "relative gap-3 py-5 ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        t.hoverRing,
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r",
          t.bar
        )}
      />
      <CardHeader className="flex-row items-start gap-3 pb-0">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            t.iconWrap
          )}
        >
          <Icon className={cn("h-5 w-5", t.icon)} />
        </div>
        <CardTitle className="pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
