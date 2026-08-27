import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  Factory,
  Gauge,
  Loader2,
  Save,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ofService } from "@/services/api/ofService";
import { machineService } from "@/services/api/machineService";
import { articleService } from "@/services/api/articleService";
import {
  blankProduction,
  evaluateMeasurement,
  inspectionService,
} from "@/services/api/inspectionService";
import { defectTypes, wasteNatures } from "@/data/mock/inspections";
import type {
  Inspection,
  InspectionCheck,
  InspectionMeasurement,
  ProductionData,
} from "@/types";

export const Route = createFileRoute("/inspection")({
  validateSearch: (search: Record<string, unknown>) => ({
    ofId: typeof search.ofId === "string" ? search.ofId : undefined,
    machineId: typeof search.machineId === "string" ? search.machineId : undefined,
    articleId: typeof search.articleId === "string" ? search.articleId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Current inspection — QC Flow" },
      {
        name: "description",
        content:
          "Guided two-hour quality inspection: visual checks, dimensional measurements against article tolerances and production data capture.",
      },
      { property: "og:title", content: "Current inspection — QC Flow" },
      { property: "og:description", content: "Run the two-hour QC control for the machine currently in production." },
    ],
  }),
  component: InspectionPage,
});

const STEPS = [
  { key: "context", label: "Context", icon: Factory },
  { key: "checks", label: "Quality checks", icon: ClipboardCheck },
  { key: "measurements", label: "Measurements", icon: Gauge },
  { key: "production", label: "Production data", icon: Cpu },
  { key: "review", label: "Review & submit", icon: CheckCircle2 },
] as const;

function InspectionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ofs = useQuery({ queryKey: ["ofs"], queryFn: () => ofService.list() });
  const machines = useQuery({ queryKey: ["machines"], queryFn: () => machineService.list() });
  const articles = useQuery({ queryKey: ["articles"], queryFn: () => articleService.list() });

  const [ofId, setOfId] = useState<string | null>(search.ofId ?? null);
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState<InspectionCheck[]>([]);
  const [measurements, setMeasurements] = useState<InspectionMeasurement[]>([]);
  const [production, setProduction] = useState<ProductionData>(blankProduction());
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const slot = inspectionService.currentSlot();
  const today = inspectionService.today();

  const activeOfs = useMemo(
    () => (ofs.data ?? []).filter((o) => o.status === "in_progress" || o.status === "paused"),
    [ofs.data],
  );

  // Resolve the OF from the search params (machine scan) or default to the first active one.
  useEffect(() => {
    if (ofId || activeOfs.length === 0) return;
    const byMachine = search.machineId ? activeOfs.find((o) => o.machineId === search.machineId) : undefined;
    const byArticle = search.articleId ? activeOfs.find((o) => o.articleId === search.articleId) : undefined;
    setOfId((byMachine ?? byArticle ?? activeOfs[0]!).id);
  }, [ofId, activeOfs, search.machineId, search.articleId]);

  const of = useMemo(() => activeOfs.find((o) => o.id === ofId) ?? null, [activeOfs, ofId]);
  const machine = useMemo(
    () => (machines.data ?? []).find((m) => m.id === of?.machineId) ?? null,
    [machines.data, of],
  );
  const article = useMemo(
    () => (articles.data ?? []).find((a) => a.id === of?.articleId) ?? null,
    [articles.data, of],
  );

  // Build the draft whenever the selected article changes.
  useEffect(() => {
    if (!article) return;
    setChecks(
      [...article.checks]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ checkId: c.id, label: c.label, result: null })),
    );
    setMeasurements(
      [...article.measurements]
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          measurementId: m.id,
          label: m.label,
          unit: m.unit,
          min: m.min,
          max: m.max,
          actual: null,
          result: null,
        })),
    );
    setStep(0);
  }, [article?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (of) setProduction((p) => ({ ...p, ouvrier: p.ouvrier || of.operator, regleur: p.regleur || of.regleur }));
  }, [of?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const answeredChecks = checks.filter((c) => c.result !== null).length;
  const answeredMeasures = measurements.filter((m) => m.actual !== null).length;
  const totalItems = checks.length + measurements.length;
  const answeredItems = answeredChecks + answeredMeasures;
  const ncItems =
    checks.filter((c) => c.result === "NC").length + measurements.filter((m) => m.result === "NC").length;
  const conformity = answeredItems ? Math.round(((answeredItems - ncItems) / answeredItems) * 1000) / 10 : 0;
  const completion = totalItems ? Math.round((answeredItems / totalItems) * 100) : 0;
  const complete = totalItems > 0 && answeredItems === totalItems;

  function setCheck(id: string, patch: Partial<InspectionCheck>) {
    setChecks((prev) => prev.map((c) => (c.checkId === id ? { ...c, ...patch } : c)));
  }

  function setMeasurement(id: string, raw: string) {
    setMeasurements((prev) =>
      prev.map((m) => {
        if (m.measurementId !== id) return m;
        const actual = raw === "" ? null : Number(raw);
        return { ...m, actual, result: evaluateMeasurement(actual, m.min, m.max) };
      }),
    );
  }

  function buildInspection(): Inspection {
    return {
      id: `insp-draft-${slot.id}`,
      date: today,
      slot,
      ofId: of!.id,
      machineId: of!.machineId,
      articleId: of!.articleId,
      inspector: user?.name ?? "Inspector",
      status: "draft",
      checks,
      measurements,
      production,
      conformityRate: conformity,
      ncCount: ncItems,
      waste: production.quantiteDechets ?? 0,
    };
  }

  async function saveDraft() {
    if (!of) return;
    setSavingDraft(true);
    try {
      await inspectionService.saveDraft(buildInspection());
      toast.success("Draft saved", { description: `Slot ${slot.start}–${slot.end} kept for later.` });
    } finally {
      setSavingDraft(false);
    }
  }

  async function submit() {
    if (!of) return;
    if (!complete) {
      toast.error("Inspection incomplete", { description: "Answer every check and measurement first." });
      return;
    }
    setSubmitting(true);
    try {
      const saved = await inspectionService.submit(buildInspection());
      toast.success("Inspection submitted", {
        description: `${saved.conformityRate}% conformity · ${saved.ncCount} non-conformities`,
      });
      void navigate({ to: "/history/$id", params: { id: saved.id } });
    } finally {
      setSubmitting(false);
    }
  }

  const loading = ofs.isLoading || machines.isLoading || articles.isLoading;

  return (
    <AppShell>
      <PageHeader
        title="Current inspection"
        description={`Two-hour control window ${slot.start} → ${slot.end} · ${today}`}
        actions={
          <>
            <Button variant="outline" onClick={saveDraft} disabled={!of || savingDraft}>
              {savingDraft ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save draft
            </Button>
            <Button onClick={submit} disabled={!of || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : !of || !article ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No production order is currently running.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Stepper */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card p-2">
              <div className="flex min-w-max items-center gap-1">
                {STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      i === step
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:bg-neutral-soft hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                        i < step ? "bg-conforme text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-neutral-soft",
                      )}
                    >
                      {i < step ? <Check className="size-3" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {step === 0 && (
              <section className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold text-foreground">Production context</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm what is being controlled during this window.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Production order</Label>
                    <Select value={ofId ?? undefined} onValueChange={setOfId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an OF" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeOfs.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Machine" value={machine ? `${machine.code} — ${machine.location}` : "—"} />
                  <Field label="Article" value={`${article.code} — ${article.name}`} />
                  <Field label="Starting product" value={of.startingProduct} />
                  <Field label="Inspector" value={user?.name ?? "—"} />
                  <Field label="Time slot" value={`${slot.start} → ${slot.end}`} />
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-neutral-soft/60 p-3 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0" />
                  {article.checks.length} quality checks and {article.measurements.length} dimensional measurements are
                  defined for this article.
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border p-5">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Quality checks</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Mark every point conforme or non conforme.</p>
                  </div>
                  <StatusBadge tone={answeredChecks === checks.length ? "conforme" : "warning"}>
                    {answeredChecks}/{checks.length}
                  </StatusBadge>
                </div>
                <ul className="divide-y divide-border">
                  {checks.map((c, i) => (
                    <li key={c.checkId} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-neutral-soft text-xs font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-foreground">{c.label}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <ToggleResult
                            active={c.result === "C"}
                            tone="conforme"
                            onClick={() => setCheck(c.checkId, { result: "C", defectType: undefined, comment: undefined })}
                          >
                            <Check className="size-4" /> Conforme
                          </ToggleResult>
                          <ToggleResult
                            active={c.result === "NC"}
                            tone="nonconforme"
                            onClick={() => setCheck(c.checkId, { result: "NC" })}
                          >
                            <X className="size-4" /> Non conforme
                          </ToggleResult>
                        </div>
                      </div>
                      {c.result === "NC" && (
                        <div className="mt-4 grid gap-3 rounded-lg border border-nonconforme/25 bg-nonconforme-soft/50 p-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Defect type</Label>
                            <Select
                              value={c.defectType ?? undefined}
                              onValueChange={(v) => setCheck(c.checkId, { defectType: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a defect" />
                              </SelectTrigger>
                              <SelectContent>
                                {defectTypes.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Comment</Label>
                            <Textarea
                              rows={2}
                              value={c.comment ?? ""}
                              placeholder="What was observed?"
                              onChange={(e) => setCheck(c.checkId, { comment: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {step === 2 && (
              <section className="rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border p-5">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Dimensional measurements</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tolerances come from the article specification — conformity is evaluated live.
                    </p>
                  </div>
                  <StatusBadge tone={answeredMeasures === measurements.length ? "conforme" : "warning"}>
                    {answeredMeasures}/{measurements.length}
                  </StatusBadge>
                </div>
                <ul className="divide-y divide-border">
                  {measurements.map((m) => (
                    <li key={m.measurementId} className="grid gap-3 p-5 sm:grid-cols-[1fr_180px_130px] sm:items-center">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                          Tolerance {m.min} – {m.max} {m.unit}
                        </p>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Measured value"
                          value={m.actual ?? ""}
                          onChange={(e) => setMeasurement(m.measurementId, e.target.value)}
                          className={cn(
                            "pr-12 tabular-nums",
                            m.result === "NC" && "border-nonconforme focus-visible:ring-nonconforme/30",
                            m.result === "C" && "border-conforme/60",
                          )}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {m.unit}
                        </span>
                      </div>
                      <div className="sm:text-right">
                        {m.result === null ? (
                          <StatusBadge tone="neutral">Pending</StatusBadge>
                        ) : m.result === "C" ? (
                          <StatusBadge tone="conforme">In tolerance</StatusBadge>
                        ) : (
                          <StatusBadge tone="nonconforme">Out of tolerance</StatusBadge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {step === 3 && (
              <section className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold text-foreground">Production data</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Machine events, staffing and waste recorded for this window.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ToggleRow
                    label="Panne machine"
                    checked={production.panneMachine}
                    onChange={(v) => setProduction((p) => ({ ...p, panneMachine: v }))}
                  />
                  <ToggleRow
                    label="Nettoyage"
                    checked={production.nettoyage}
                    onChange={(v) => setProduction((p) => ({ ...p, nettoyage: v }))}
                  />
                  <ToggleRow
                    label="Manque de matière"
                    checked={production.manqueMatiere}
                    onChange={(v) => setProduction((p) => ({ ...p, manqueMatiere: v }))}
                  />
                  <ToggleRow
                    label="Manque de personnel"
                    checked={production.manquePersonnel}
                    onChange={(v) => setProduction((p) => ({ ...p, manquePersonnel: v }))}
                  />
                </div>

                {production.panneMachine && (
                  <div className="mt-4 max-w-xs space-y-1.5">
                    <Label>Downtime (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={production.panneMachineMinutes}
                      onChange={(e) =>
                        setProduction((p) => ({ ...p, panneMachineMinutes: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Ouvrier"
                    value={production.ouvrier}
                    onChange={(v) => setProduction((p) => ({ ...p, ouvrier: v }))}
                  />
                  <TextField
                    label="Régleur"
                    value={production.regleur}
                    onChange={(v) => setProduction((p) => ({ ...p, regleur: v }))}
                  />
                  <NumberField
                    label="Compteur machine"
                    value={production.compteurMachine}
                    onChange={(v) => setProduction((p) => ({ ...p, compteurMachine: v }))}
                  />
                  <NumberField
                    label="Quantité de déchets (kg)"
                    value={production.quantiteDechets}
                    onChange={(v) => setProduction((p) => ({ ...p, quantiteDechets: v }))}
                  />
                  <div className="space-y-1.5">
                    <Label>Nature des déchets</Label>
                    <Select
                      value={production.natureDechets || undefined}
                      onValueChange={(v) => setProduction((p) => ({ ...p, natureDechets: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a nature" />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteNatures.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <NumberField
                    label="Cycle (s)"
                    value={production.cycle}
                    onChange={(v) => setProduction((p) => ({ ...p, cycle: v }))}
                  />
                  <NumberField
                    label="Poids pièce (g)"
                    value={production.poids}
                    onChange={(v) => setProduction((p) => ({ ...p, poids: v }))}
                  />
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <h2 className="text-base font-semibold text-foreground">Review</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {complete
                      ? "Everything is filled in. Submit to lock this inspection."
                      : `${totalItems - answeredItems} item(s) still need an answer.`}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <SummaryTile label="Conformity" value={`${conformity}%`} tone={ncItems ? "warning" : "conforme"} />
                    <SummaryTile label="Non-conformities" value={ncItems} tone={ncItems ? "nonconforme" : "conforme"} />
                    <SummaryTile label="Waste" value={`${production.quantiteDechets ?? 0} kg`} tone="warning" />
                  </div>
                </div>

                {ncItems > 0 && (
                  <div className="rounded-xl border border-nonconforme/25 bg-nonconforme-soft/40 p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-nonconforme">
                      <AlertTriangle className="size-4" /> Non-conformities detected
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-foreground">
                      {checks
                        .filter((c) => c.result === "NC")
                        .map((c) => (
                          <li key={c.checkId}>
                            {c.label}
                            {c.defectType ? ` — ${c.defectType}` : ""}
                          </li>
                        ))}
                      {measurements
                        .filter((m) => m.result === "NC")
                        .map((m) => (
                          <li key={m.measurementId} className="tabular-nums">
                            {m.label} — {m.actual} {m.unit} (tolerance {m.min}–{m.max})
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground">Production summary</h3>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <Field label="Ouvrier" value={production.ouvrier || "—"} />
                    <Field label="Régleur" value={production.regleur || "—"} />
                    <Field label="Compteur" value={production.compteurMachine ?? "—"} />
                    <Field label="Cycle" value={production.cycle ? `${production.cycle} s` : "—"} />
                    <Field label="Poids" value={production.poids ? `${production.poids} g` : "—"} />
                    <Field label="Nature déchets" value={production.natureDechets || "—"} />
                  </dl>
                </div>
              </section>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Next <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit
                  inspection
                </Button>
              )}
            </div>
          </div>

          {/* Live summary */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Completion</p>
                <span className="text-sm font-semibold tabular-nums text-foreground">{completion}%</span>
              </div>
              <Progress value={completion} className="mt-3" />
              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Checks" value={`${answeredChecks}/${checks.length}`} />
                <SummaryRow label="Measurements" value={`${answeredMeasures}/${measurements.length}`} />
                <SummaryRow
                  label="Conformity"
                  value={`${conformity}%`}
                  tone={ncItems ? "nonconforme" : "conforme"}
                />
                <SummaryRow label="Non-conformities" value={ncItems} tone={ncItems ? "nonconforme" : undefined} />
              </dl>
            </div>

            {machine && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm font-semibold text-foreground">{machine.code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{machine.location}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone={machine.status === "running" ? "conforme" : "warning"}>
                    {machine.status}
                  </StatusBadge>
                  <StatusBadge tone="neutral">{machine.downtimeMinutesToday} min downtime</StatusBadge>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        className="tabular-nums"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ToggleResult({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "conforme" | "nonconforme";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active && tone === "conforme" && "border-conforme bg-conforme text-white",
        active && tone === "nonconforme" && "border-nonconforme bg-nonconforme text-white",
        !active && "border-border text-muted-foreground hover:bg-neutral-soft hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "conforme" | "nonconforme";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-semibold tabular-nums text-foreground",
          tone === "conforme" && "text-conforme",
          tone === "nonconforme" && "text-nonconforme",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "conforme" | "nonconforme" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "conforme" && "text-conforme",
          tone === "nonconforme" && "text-nonconforme",
          tone === "warning" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
