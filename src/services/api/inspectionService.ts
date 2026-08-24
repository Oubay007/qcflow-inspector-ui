import type {
  Article,
  Inspection,
  InspectionCheck,
  InspectionMeasurement,
  ProductionData,
  TimeSlot,
} from "@/types";
import { mockInspections, timeSlots, TODAY } from "@/data/mock/inspections";
import { mockArticles } from "@/data/mock/articles";
import { delay } from "./client";

let inspections: Inspection[] = [...mockInspections];

export interface InspectionFilters {
  date?: string;
  ofId?: string;
  machineId?: string;
  articleId?: string;
  inspector?: string;
  status?: Inspection["status"];
  search?: string;
}

/** Mock tolerance evaluation — the backend will own this later. */
export function evaluateMeasurement(actual: number | null, min: number, max: number): "C" | "NC" | null {
  if (actual === null || Number.isNaN(actual)) return null;
  return actual >= min && actual <= max ? "C" : "NC";
}

export function blankProduction(ouvrier = "", regleur = ""): ProductionData {
  return {
    panneMachine: false,
    panneMachineMinutes: 0,
    nettoyage: false,
    manqueMatiere: false,
    manquePersonnel: false,
    ouvrier,
    regleur,
    compteurMachine: null,
    quantiteDechets: null,
    natureDechets: "",
    cycle: null,
    poids: null,
  };
}

function draftFromArticle(article: Article): {
  checks: InspectionCheck[];
  measurements: InspectionMeasurement[];
} {
  return {
    checks: [...article.checks]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ checkId: c.id, label: c.label, result: null })),
    measurements: [...article.measurements]
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
  };
}

export const CURRENT_SLOT_INDEX = 2; // 12:00 -> 14:00

export const inspectionService = {
  slots(): TimeSlot[] {
    return timeSlots;
  },

  today(): string {
    return TODAY;
  },

  currentSlot(): TimeSlot {
    return timeSlots[CURRENT_SLOT_INDEX]!;
  },

  async list(filters: InspectionFilters = {}): Promise<Inspection[]> {
    const out = inspections.filter((i) => {
      if (filters.date && i.date !== filters.date) return false;
      if (filters.ofId && i.ofId !== filters.ofId) return false;
      if (filters.machineId && i.machineId !== filters.machineId) return false;
      if (filters.articleId && i.articleId !== filters.articleId) return false;
      if (filters.inspector && i.inspector !== filters.inspector) return false;
      if (filters.status && i.status !== filters.status) return false;
      if (filters.search && !`${i.id} ${i.inspector}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
    return delay(out.sort((a, b) => (a.date === b.date ? b.slot.start.localeCompare(a.slot.start) : b.date.localeCompare(a.date))));
  },

  async get(id: string): Promise<Inspection | null> {
    return delay(inspections.find((i) => i.id === id) ?? null);
  },

  /** Draft for the running 2-hour window on a given machine/OF/article. */
  async currentDraft(input: { ofId: string; machineId: string; articleId: string; inspector: string }): Promise<Inspection> {
    const article = mockArticles.find((a) => a.id === input.articleId) ?? mockArticles[0]!;
    const { checks, measurements } = draftFromArticle(article);
    const slot = this.currentSlot();
    const existing = inspections.find(
      (i) => i.date === TODAY && i.slot.id === slot.id && i.ofId === input.ofId && i.status === "draft",
    );
    if (existing) return delay(existing);
    return delay({
      id: `insp-draft-${slot.id}`,
      date: TODAY,
      slot,
      ofId: input.ofId,
      machineId: input.machineId,
      articleId: input.articleId,
      inspector: input.inspector,
      status: "draft",
      checks,
      measurements,
      production: blankProduction("Youssef Amrani", "Mehdi Ouazzani"),
      conformityRate: 0,
      ncCount: 0,
      waste: 0,
    });
  },

  /** POST /inspections */
  async submit(inspection: Inspection): Promise<Inspection> {
    const results = [
      ...inspection.checks.map((c) => c.result),
      ...inspection.measurements.map((m) => m.result),
    ].filter(Boolean);
    const ncCount = results.filter((r) => r === "NC").length;
    const saved: Inspection = {
      ...inspection,
      id: inspection.id.startsWith("insp-draft") ? `insp-${Date.now()}` : inspection.id,
      status: "submitted",
      ncCount,
      conformityRate: results.length ? Math.round(((results.length - ncCount) / results.length) * 1000) / 10 : 0,
      waste: inspection.production.quantiteDechets ?? 0,
    };
    inspections = [saved, ...inspections.filter((i) => i.id !== saved.id)];
    return delay(saved, 600);
  },

  async saveDraft(inspection: Inspection): Promise<Inspection> {
    const draft = { ...inspection, status: "draft" as const };
    inspections = [draft, ...inspections.filter((i) => i.id !== draft.id)];
    return delay(draft, 350);
  },
};
