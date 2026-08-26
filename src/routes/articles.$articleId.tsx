import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { articleService } from "@/services/api/articleService";

export const Route = createFileRoute("/articles/$articleId")({
  head: () => ({
    meta: [
      { title: "Article quality specification — QC Flow" },
      {
        name: "description",
        content: "Edit the visual checklist and dimensional tolerances (min/max, unit) applied to this article at every inspection.",
      },
      { property: "og:title", content: "Article quality specification — QC Flow" },
      { property: "og:description", content: "Per-article checks and measurement tolerances." },
    ],
  }),
  component: ArticleDetailPage,
});

function ArticleDetailPage() {
  const { articleId } = Route.useParams();
  const qc = useQueryClient();
  const article = useQuery({ queryKey: ["article", articleId], queryFn: () => articleService.get(articleId) });

  const [check, setCheck] = useState("");
  const [meas, setMeas] = useState({ label: "", unit: "mm", min: "", max: "" });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["article", articleId] });
    void qc.invalidateQueries({ queryKey: ["articles"] });
  };

  const addCheck = useMutation({
    mutationFn: () =>
      articleService.saveCheck(articleId, { id: "", label: check, order: 999, required: true }),
    onSuccess: () => { refresh(); setCheck(""); toast.success("Check added"); },
  });
  const delCheck = useMutation({
    mutationFn: (id: string) => articleService.deleteCheck(articleId, id),
    onSuccess: () => { refresh(); toast.success("Check removed"); },
  });
  const reorder = useMutation({
    mutationFn: (v: { id: string; dir: -1 | 1 }) => articleService.reorderChecks(articleId, v.id, v.dir),
    onSuccess: refresh,
  });
  const addMeas = useMutation({
    mutationFn: () =>
      articleService.saveMeasurement(articleId, {
        id: "",
        label: meas.label,
        unit: meas.unit,
        min: Number(meas.min),
        max: Number(meas.max),
        order: 999,
      }),
    onSuccess: () => { refresh(); setMeas({ label: "", unit: "mm", min: "", max: "" }); toast.success("Measurement added"); },
  });
  const delMeas = useMutation({
    mutationFn: (id: string) => articleService.deleteMeasurement(articleId, id),
    onSuccess: () => { refresh(); toast.success("Measurement removed"); },
  });

  if (article.isLoading) {
    return <AppShell><Skeleton className="h-96 rounded-xl" /></AppShell>;
  }
  if (!article.data) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Article not found.</p>
        <Button asChild variant="outline" size="sm"><Link to="/articles">Back to articles</Link></Button>
      </AppShell>
    );
  }

  const a = article.data;
  const checks = [...a.checks].sort((x, y) => x.order - y.order);
  const measurements = [...a.measurements].sort((x, y) => x.order - y.order);

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/articles"><ArrowLeft className="size-4" /> All articles</Link>
      </Button>
      <PageHeader title={a.name} description={`${a.code} — ${a.description}`} />

      <Tabs defaultValue="checks">
        <TabsList>
          <TabsTrigger value="checks">Quality checks ({checks.length})</TabsTrigger>
          <TabsTrigger value="measurements">Measurements ({measurements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {checks.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 text-sm text-foreground">{c.label}</span>
                  <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0} onClick={() => reorder.mutate({ id: c.id, dir: -1 })} aria-label="Move up"><ArrowUp className="size-4" /></button>
                  <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === checks.length - 1} onClick={() => reorder.mutate({ id: c.id, dir: 1 })} aria-label="Move down"><ArrowDown className="size-4" /></button>
                  <button className="text-muted-foreground hover:text-nonconforme" onClick={() => delCheck.mutate(c.id)} aria-label="Delete check"><Trash2 className="size-4" /></button>
                </li>
              ))}
              {checks.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No checks defined yet.</li>}
            </ul>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add a visual/functional check" value={check} onChange={(e) => setCheck(e.target.value)} />
            <Button onClick={() => addCheck.mutate()} disabled={!check.trim()}><Plus className="size-4" /> Add</Button>
          </div>
        </TabsContent>

        <TabsContent value="measurements" className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Measurement</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Min</th>
                  <th className="px-4 py-3 font-medium">Max</th>
                  <th className="px-4 py-3 font-medium">Tolerance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{m.min}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{m.max}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">±{((m.max - m.min) / 2).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-muted-foreground hover:text-nonconforme" onClick={() => delMeas.mutate(m.id)} aria-label="Delete measurement"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
                {measurements.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No measurements defined yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Label</Label>
              <Input value={meas.label} onChange={(e) => setMeas({ ...meas, label: e.target.value })} placeholder="Diamètre extérieur" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={meas.unit} onChange={(e) => setMeas({ ...meas, unit: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Min</Label>
              <Input type="number" step="any" value={meas.min} onChange={(e) => setMeas({ ...meas, min: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Max</Label>
              <Input type="number" step="any" value={meas.max} onChange={(e) => setMeas({ ...meas, max: e.target.value })} />
            </div>
            <div className="sm:col-span-5">
              <Button onClick={() => addMeas.mutate()} disabled={!meas.label || meas.min === "" || meas.max === ""}>
                <Plus className="size-4" /> Add measurement
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
