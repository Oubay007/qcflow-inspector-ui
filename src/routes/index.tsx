import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, ClipboardCheck, Cpu, Gauge, Recycle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge, resultTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { analyticsService } from "@/services/api/analyticsService";
import { machineService } from "@/services/api/machineService";
import { inspectionService } from "@/services/api/inspectionService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quality Dashboard — QC Flow" },
      { name: "description", content: "Live plant quality dashboard: conformity rate, non-conformities, waste, machine status and the two-hour inspection schedule." },
      { property: "og:title", content: "Quality Dashboard — QC Flow" },
      { property: "og:description", content: "Live conformity, waste and machine status across your production lines." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const kpis = useQuery({ queryKey: ["kpis"], queryFn: () => analyticsService.kpis() });
  const analytics = useQuery({ queryKey: ["analytics", {}], queryFn: () => analyticsService.analytics() });
  const machines = useQuery({ queryKey: ["machines"], queryFn: () => machineService.list() });
  const inspections = useQuery({ queryKey: ["inspections", {}], queryFn: () => inspectionService.list() });
  const slots = inspectionService.slots();
  const currentSlot = inspectionService.currentSlot();

  return (
    <AppShell>
      <PageHeader
        title="Quality dashboard"
        description="Real-time conformity across all lines — updated at every two-hour inspection window."
        actions={
          <Button asChild>
            <Link to="/inspection">
              <ClipboardCheck className="size-4" /> Start current inspection
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.isLoading || !kpis.data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)
        ) : (
          <>
            <KpiCard
              label="Conformity rate"
              value={kpis.data.conformityRate}
              unit="%"
              icon={Gauge}
              delta={kpis.data.conformityDelta}
              tone="conforme"
              hint="vs yesterday"
            />
            <KpiCard
              label="Inspections today"
              value={`${kpis.data.inspectionsToday}/${kpis.data.inspectionsPlanned}`}
              icon={ClipboardCheck}
              hint="planned slots covered"
            />
            <KpiCard
              label="Non-conformities"
              value={kpis.data.nonConformities}
              icon={AlertTriangle}
              tone="nonconforme"
              hint="today, all lines"
            />
            <KpiCard label="Waste" value={kpis.data.totalWaste} unit="kg" icon={Recycle} tone="warning" hint="today" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Conformity trend</h2>
            <StatusBadge tone="primary" dot={false}>Last 3 days</StatusBadge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.data?.trend ?? []}>
                <defs>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-conforme)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-conforme)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="conforme" stroke="var(--color-conforme)" fill="url(#gC)" strokeWidth={2} />
                <Area type="monotone" dataKey="nonConforme" stroke="var(--color-nonconforme)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Top defects</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.data?.defects ?? []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={92} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold">Today&apos;s inspection schedule</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {slots.map((slot, i) => {
            const done = (inspections.data ?? []).filter(
              (x) => x.date === inspectionService.today() && x.slot.id === slot.id,
            ).length;
            const state = slot.id === currentSlot.id ? "current" : i < 2 ? "done" : "upcoming";
            return (
              <div
                key={slot.id}
                className={
                  "rounded-lg border p-3 " +
                  (state === "current" ? "border-primary bg-primary-soft" : "border-border bg-surface-muted")
                }
              >
                <p className="text-sm font-semibold tabular-nums">
                  {slot.start} – {slot.end}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{done} inspections logged</p>
                <div className="mt-2">
                  {state === "current" ? (
                    <StatusBadge tone="primary">In progress</StatusBadge>
                  ) : state === "done" ? (
                    <StatusBadge tone="conforme">Complete</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Upcoming</StatusBadge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Machine status</h2>
            <Link to="/machines" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(machines.data ?? []).slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                  <Cpu className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to="/machines/$id" params={{ id: m.id }} className="text-sm font-medium hover:underline">
                    {m.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{m.location}</p>
                </div>
                <StatusBadge tone={resultTone(m.status)}>{m.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent inspections</h2>
            <Link to="/history" className="text-xs font-medium text-primary hover:underline">
              View history
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(inspections.data ?? []).slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                  <Boxes className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to="/history/$id" params={{ id: i.id }} className="text-sm font-medium hover:underline">
                    {i.slot.start}–{i.slot.end} · {i.machineId.toUpperCase()}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.date} · {i.inspector}
                  </p>
                </div>
                <StatusBadge tone={i.ncCount ? "nonconforme" : "conforme"}>
                  {i.ncCount ? `${i.ncCount} NC` : "Conforme"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
