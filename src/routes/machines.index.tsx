import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Cpu, QrCode } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge, resultTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { machineService } from "@/services/api/machineService";
import { ofService } from "@/services/api/ofService";
import { articleService } from "@/services/api/articleService";

export const Route = createFileRoute("/machines/")({
  head: () => ({
    meta: [
      { title: "Machines — QC Flow" },
      {
        name: "description",
        content: "Live machine park status: running lines, downtime, current OF and the next two-hour quality inspection.",
      },
      { property: "og:title", content: "Machines — QC Flow" },
      { property: "og:description", content: "Monitor machine status, downtime and inspection timing in real time." },
    ],
  }),
  component: MachinesPage,
});

function MachinesPage() {
  const machines = useQuery({ queryKey: ["machines"], queryFn: () => machineService.list() });
  const ofs = useQuery({ queryKey: ["ofs"], queryFn: () => ofService.list() });
  const articles = useQuery({ queryKey: ["articles"], queryFn: () => articleService.list() });

  return (
    <AppShell>
      <PageHeader
        title="Machines"
        description="Every press on the floor, its running order and its quality state."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/scan"><QrCode className="size-4" /> Scan machine</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        {(machines.data ?? []).map((m) => {
          const of = ofs.data?.find((o) => o.id === m.currentOfId);
          const article = articles.data?.find((a) => a.id === m.currentArticleId);
          return (
            <div key={m.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Cpu className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold tracking-tight text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.code} · {m.location}</p>
                  </div>
                </div>
                <StatusBadge tone={resultTone(m.status)}>{m.status}</StatusBadge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Current OF</dt>
                  <dd className="font-medium text-foreground">{of?.number ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Article</dt>
                  <dd className="truncate font-medium text-foreground">{article?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Operator</dt>
                  <dd className="font-medium text-foreground">{m.currentOperator ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Downtime today</dt>
                  <dd className="font-medium tabular-nums text-foreground">{m.downtimeMinutesToday} min</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" /> Next check {m.nextInspectionAt ?? "—"}
                </span>
                <StatusBadge tone={resultTone(m.qcStatus)} dot={false}>{m.qcStatus.replace("_", " ")}</StatusBadge>
              </div>

              {m.problems.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {m.problems.slice(0, 2).map((p) => (
                    <p key={p.id} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      <span>{p.label} · {p.durationMinutes} min</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link to="/inspection" search={{ machineId: m.id }}>Inspect now</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/history" search={{ machineId: m.id }}>History</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
