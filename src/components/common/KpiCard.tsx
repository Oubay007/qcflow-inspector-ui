import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  tone?: "primary" | "conforme" | "nonconforme" | "warning";
}) {
  const toneBg = {
    primary: "bg-primary-soft text-primary",
    conforme: "bg-conforme-soft text-conforme",
    nonconforme: "bg-nonconforme-soft text-nonconforme",
    warning: "bg-warning-soft text-warning-foreground",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", toneBg)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              delta >= 0 ? "text-conforme" : "text-nonconforme",
            )}
          >
            {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
