import { cn } from "@/lib/utils";

export function OnboardingProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            step <= current ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
