import { cn } from "@/lib/utils";

type Tone = "conforme" | "nonconforme" | "warning" | "neutral" | "primary";

const toneClass: Record<Tone, string> = {
  conforme: "bg-conforme-soft text-conforme border-conforme/25",
  nonconforme: "bg-nonconforme-soft text-nonconforme border-nonconforme/25",
  warning: "bg-warning-soft text-warning-foreground border-warning/35",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
  primary: "bg-primary-soft text-primary border-primary/25",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot = true,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function resultTone(result: string | null | undefined): Tone {
  if (result === "C" || result === "conforme" || result === "running" || result === "active" || result === "completed")
    return "conforme";
  if (result === "NC" || result === "non_conforme" || result === "stopped") return "nonconforme";
  if (result === "warning" || result === "maintenance" || result === "paused" || result === "pending") return "warning";
  if (result === "in_progress" || result === "submitted") return "primary";
  return "neutral";
}
