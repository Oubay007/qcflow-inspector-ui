import type {
  AnalyticsData,
  AnalyticsFilters,
  DefectPoint,
  Inspection,
  KpiSummary,
  ReportFilters,
  ReportSummary,
  TrendPoint,
} from "@/types";
import { mockInspections, TODAY, timeSlots } from "@/data/mock/inspections";
import { mockOfs } from "@/data/mock/ofs";
import { mockMachines } from "@/data/mock/machines";
import { delay } from "./client";

function match(i: Inspection, f: { machineId?: string; articleId?: string; ofId?: string }) {
  if (f.machineId && i.machineId !== f.machineId) return false;
  if (f.articleId && i.articleId !== f.articleId) return false;
  if (f.ofId && i.ofId !== f.ofId) return false;
  return true;
}

function rate(list: Inspection[]) {
  const results = list.flatMap((i) => [...i.checks.map((c) => c.result), ...i.measurements.map((m) => m.result)]);
  const nc = results.filter((r) => r === "NC").length;
  return results.length ? Math.round(((results.length - nc) / results.length) * 1000) / 10 : 0;
}

function defectBreakdown(list: Inspection[]): DefectPoint[] {
  const map = new Map<string, number>();
  list.forEach((i) =>
    i.checks.forEach((c) => {
      if (c.result === "NC" && c.defectType) map.set(c.defectType, (map.get(c.defectType) ?? 0) + 1);
    }),
  );
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function topNcChecks(list: Inspection[]): DefectPoint[] {
  const map = new Map<string, number>();
  list.forEach((i) =>
    i.checks.forEach((c) => {
      if (c.result === "NC") map.set(c.label, (map.get(c.label) ?? 0) + 1);
    }),
  );
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
}

function deviations(list: Inspection[]) {
  const map = new Map<string, { sum: number; n: number; tolerance: number }>();
  list.forEach((i) =>
    i.measurements.forEach((m) => {
      if (m.actual === null) return;
      const mid = (m.min + m.max) / 2;
      const cur = map.get(m.label) ?? { sum: 0, n: 0, tolerance: (m.max - m.min) / 2 };
      cur.sum += m.actual - mid;
      cur.n += 1;
      map.set(m.label, cur);
    }),
  );
  return [...map.entries()].map(([label, v]) => ({
    label,
    deviation: Number((v.sum / v.n).toFixed(3)),
    tolerance: Number(v.tolerance.toFixed(3)),
  }));
}

function byDate(list: Inspection[]): TrendPoint[] {
  const dates = [...new Set(list.map((i) => i.date))].sort();
  return dates.map((d) => {
    const day = list.filter((i) => i.date === d);
    const results = day.flatMap((i) => [...i.checks.map((c) => c.result), ...i.measurements.map((m) => m.result)]);
    const nonConforme = results.filter((r) => r === "NC").length;
    return {
      label: d.slice(5),
      conforme: results.length - nonConforme,
      nonConforme,
      waste: Number(day.reduce((s, i) => s + i.waste, 0).toFixed(1)),
      production: day.length * 2100,
    };
  });
}

export const analyticsService = {
  async kpis(): Promise<KpiSummary> {
    const today = mockInspections.filter((i) => i.date === TODAY);
    const yesterday = mockInspections.filter((i) => i.date === "2026-08-23");
    const planned = timeSlots.length * mockOfs.filter((o) => o.status === "in_progress").length;
    return delay({
      inspectionsToday: today.length,
      inspectionsPlanned: planned,
      conformityRate: rate(today),
      conformityDelta: Number((rate(today) - rate(yesterday)).toFixed(1)),
      nonConformities: today.reduce((s, i) => s + i.ncCount, 0),
      totalWaste: Number(today.reduce((s, i) => s + i.waste, 0).toFixed(1)),
      productionQuantity: mockOfs.reduce((s, o) => s + o.producedQuantity, 0),
      activeOfs: mockOfs.filter((o) => o.status === "in_progress").length,
    });
  },

  async analytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
    const list = mockInspections.filter((i) => match(i, filters));
    const trend = byDate(list);
    return delay({
      trend,
      defects: defectBreakdown(list),
      topNcChecks: topNcChecks(list),
      measurementDeviations: deviations(list),
      completionRate: Math.min(100, Math.round((list.length / (timeSlots.length * 3)) * 100)),
      conformityRate: rate(list),
      ncTrend: trend.map((t) => ({ label: t.label, value: t.nonConforme })),
    });
  },

  async report(filters: ReportFilters): Promise<ReportSummary> {
    const list = mockInspections.filter((i) => match(i, filters));
    const production = list.length * 2100;
    const waste = Number(list.reduce((s, i) => s + i.waste, 0).toFixed(1));
    const machineProblems = mockMachines
      .flatMap((m) => m.problems.map((p) => ({ label: p.label.split(" — ")[0]!, value: p.durationMinutes })))
      .reduce<DefectPoint[]>((acc, p) => {
        const found = acc.find((x) => x.label === p.label);
        if (found) found.value += p.value;
        else acc.push({ ...p });
        return acc;
      }, []);
    return delay({
      period: filters.type === "daily" ? TODAY : filters.type === "weekly" ? "2026-W35" : "August 2026",
      production,
      waste,
      wasteRate: production ? Number(((waste / production) * 100).toFixed(3)) : 0,
      conformityRate: rate(list),
      ncCount: list.reduce((s, i) => s + i.ncCount, 0),
      inspectionCompletion: Math.min(100, Math.round((list.length / (timeSlots.length * 3)) * 100)),
      defects: defectBreakdown(list),
      machineProblems: machineProblems.sort((a, b) => b.value - a.value),
      measurementDeviations: deviations(list),
    });
  },
};
