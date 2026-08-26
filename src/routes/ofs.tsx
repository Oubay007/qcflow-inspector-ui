import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge, resultTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ofService } from "@/services/api/ofService";
import { articleService } from "@/services/api/articleService";
import { machineService } from "@/services/api/machineService";
import type { OfStatus } from "@/types";

export const Route = createFileRoute("/ofs")({
  head: () => ({
    meta: [
      { title: "Production orders (OF) — QC Flow" },
      {
        name: "description",
        content: "Track every ordre de fabrication: article, machine, planned vs produced quantity and live progress.",
      },
      { property: "og:title", content: "Production orders — QC Flow" },
      { property: "og:description", content: "Manage OFs, quantities and machine assignments across the plant." },
    ],
  }),
  component: OfsPage,
});

const STATUSES: OfStatus[] = ["planned", "in_progress", "paused", "completed"];

function OfsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const ofs = useQuery({ queryKey: ["ofs"], queryFn: () => ofService.list() });
  const articles = useQuery({ queryKey: ["articles"], queryFn: () => articleService.list() });
  const machines = useQuery({ queryKey: ["machines"], queryFn: () => machineService.list() });

  const [form, setForm] = useState({
    number: "",
    articleId: "",
    machineId: "",
    startingProduct: "",
    plannedQuantity: "",
    operator: "",
    regleur: "",
  });

  const create = useMutation({
    mutationFn: () =>
      ofService.create({
        number: form.number,
        articleId: form.articleId,
        machineId: form.machineId,
        startingProduct: form.startingProduct,
        plannedQuantity: Number(form.plannedQuantity) || 0,
        producedQuantity: 0,
        startDate: new Date().toISOString().slice(0, 10),
        status: "planned",
        operator: form.operator,
        regleur: form.regleur,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ofs"] });
      toast.success("Production order created");
      setOpen(false);
      setForm({ number: "", articleId: "", machineId: "", startingProduct: "", plannedQuantity: "", operator: "", regleur: "" });
    },
  });

  const articleName = (id: string) => articles.data?.find((a) => a.id === id)?.name ?? "—";
  const machineName = (id: string) => machines.data?.find((m) => m.id === id)?.name ?? "—";

  const rows = useMemo(
    () =>
      (ofs.data ?? []).filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return `${o.number} ${articleName(o.articleId)} ${machineName(o.machineId)} ${o.operator}`.toLowerCase().includes(q);
      }),
    [ofs.data, status, search, articles.data, machines.data],
  );

  return (
    <AppShell>
      <PageHeader
        title="Production orders"
        description="Every ordre de fabrication currently planned or running on the shop floor."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> New OF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New production order</DialogTitle>
                <DialogDescription>Assign an article and machine to start a new OF.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>OF number</Label>
                  <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="OF-2026-0042" />
                </div>
                <div className="space-y-1.5">
                  <Label>Planned quantity</Label>
                  <Input
                    type="number"
                    value={form.plannedQuantity}
                    onChange={(e) => setForm({ ...form, plannedQuantity: e.target.value })}
                    placeholder="25000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Article</Label>
                  <Select value={form.articleId} onValueChange={(v) => setForm({ ...form, articleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select article" /></SelectTrigger>
                    <SelectContent>
                      {(articles.data ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Machine</Label>
                  <Select value={form.machineId} onValueChange={(v) => setForm({ ...form, machineId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                    <SelectContent>
                      {(machines.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Starting product</Label>
                  <Input value={form.startingProduct} onChange={(e) => setForm({ ...form, startingProduct: e.target.value })} placeholder="PP copolymer" />
                </div>
                <div className="space-y-1.5">
                  <Label>Operator</Label>
                  <Input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Régleur</Label>
                  <Input value={form.regleur} onChange={(e) => setForm({ ...form, regleur: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={!form.number || create.isPending}>Create OF</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search OF, article, machine or operator" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">OF</th>
                <th className="px-4 py-3 font-medium">Article</th>
                <th className="px-4 py-3 font-medium">Machine</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Operator</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ofs.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td className="px-4 py-4" colSpan={7}><Skeleton className="h-5 w-full" /></td></tr>
                ))}
              {rows.map((o) => {
                const pct = o.plannedQuantity ? Math.min(100, Math.round((o.producedQuantity / o.plannedQuantity) * 100)) : 0;
                return (
                  <tr key={o.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{o.number}</p>
                      <p className="text-xs text-muted-foreground">Started {o.startDate}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{articleName(o.articleId)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{machineName(o.machineId)}</td>
                    <td className="px-4 py-3">
                      <div className="w-40 space-y-1.5">
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {o.producedQuantity.toLocaleString()} / {o.plannedQuantity.toLocaleString()} ({pct}%)
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.operator}</td>
                    <td className="px-4 py-3"><StatusBadge tone={resultTone(o.status)}>{o.status.replace("_", " ")}</StatusBadge></td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/history" search={{ ofId: o.id }}>Inspections</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!ofs.isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No production orders match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
