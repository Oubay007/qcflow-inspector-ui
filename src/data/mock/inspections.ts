import type { Inspection, InspectionCheck, InspectionMeasurement, TimeSlot } from "@/types";
import { mockArticles } from "./articles";

export const timeSlots: TimeSlot[] = [
  { id: "slot-1", start: "08:00", end: "10:00" },
  { id: "slot-2", start: "10:00", end: "12:00" },
  { id: "slot-3", start: "12:00", end: "14:00" },
  { id: "slot-4", start: "14:00", end: "16:00" },
  { id: "slot-5", start: "16:00", end: "18:00" },
];

export const defectTypes = [
  "Bavure",
  "Retassure",
  "Rayure",
  "Bulle / porosité",
  "Déformation",
  "Teinte non conforme",
  "Étiquette illisible",
  "Contamination",
];

export const wasteNatures = ["Carotte", "Rebut démarrage", "Purge", "Pièce déformée", "Contrôle destructif"];

export const TODAY = "2026-08-24";

function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildChecks(articleId: string, seed: number, ncIndexes: number[] = []): InspectionCheck[] {
  const article = mockArticles.find((a) => a.id === articleId)!;
  return article.checks.map((c, i) => {
    const isNc = ncIndexes.includes(i);
    return {
      checkId: c.id,
      label: c.label,
      result: isNc ? "NC" : "C",
      comment: isNc ? "Défaut détecté sur 3 pièces du prélèvement." : undefined,
      defectType: isNc ? defectTypes[Math.floor(seeded(seed + i) * defectTypes.length)] : undefined,
    };
  });
}

function buildMeasurements(articleId: string, seed: number, forceOutIndex = -1): InspectionMeasurement[] {
  const article = mockArticles.find((a) => a.id === articleId)!;
  return article.measurements.map((m, i) => {
    const span = m.max - m.min;
    const actual =
      i === forceOutIndex
        ? Number((m.max + span * 0.35).toFixed(2))
        : Number((m.min + span * (0.25 + seeded(seed + i * 7) * 0.5)).toFixed(2));
    return {
      measurementId: m.id,
      label: m.label,
      unit: m.unit,
      min: m.min,
      max: m.max,
      actual,
      result: actual >= m.min && actual <= m.max ? "C" : "NC",
    };
  });
}

interface Seed {
  id: string;
  date: string;
  slotIndex: number;
  ofId: string;
  machineId: string;
  articleId: string;
  inspector: string;
  status: Inspection["status"];
  ncIndexes?: number[];
  outMeasure?: number;
  waste: number;
  counter: number;
}

const seeds: Seed[] = [
  { id: "insp-1001", date: TODAY, slotIndex: 0, ofId: "of-001", machineId: "mch-01", articleId: "art-001", inspector: "Ahmed Bennani", status: "submitted", waste: 3.2, counter: 128400 },
  { id: "insp-1002", date: TODAY, slotIndex: 1, ofId: "of-001", machineId: "mch-01", articleId: "art-001", inspector: "Ahmed Bennani", status: "submitted", waste: 4.1, counter: 131120 },
  { id: "insp-1003", date: TODAY, slotIndex: 0, ofId: "of-002", machineId: "mch-02", articleId: "art-002", inspector: "Imane Tazi", status: "submitted", ncIndexes: [1], outMeasure: 0, waste: 7.8, counter: 88220 },
  { id: "insp-1004", date: TODAY, slotIndex: 1, ofId: "of-002", machineId: "mch-02", articleId: "art-002", inspector: "Imane Tazi", status: "submitted", ncIndexes: [0, 3], waste: 9.4, counter: 90140 },
  { id: "insp-1005", date: TODAY, slotIndex: 0, ofId: "of-003", machineId: "mch-03", articleId: "art-003", inspector: "Nadia El Fassi", status: "submitted", waste: 2.4, counter: 40210 },
  { id: "insp-0901", date: "2026-08-23", slotIndex: 4, ofId: "of-001", machineId: "mch-01", articleId: "art-001", inspector: "Ahmed Bennani", status: "submitted", waste: 3.9, counter: 124800 },
  { id: "insp-0902", date: "2026-08-23", slotIndex: 3, ofId: "of-001", machineId: "mch-01", articleId: "art-001", inspector: "Ahmed Bennani", status: "submitted", ncIndexes: [2], waste: 5.5, counter: 122100 },
  { id: "insp-0903", date: "2026-08-23", slotIndex: 2, ofId: "of-002", machineId: "mch-02", articleId: "art-002", inspector: "Imane Tazi", status: "submitted", waste: 6.1, counter: 85300 },
  { id: "insp-0904", date: "2026-08-23", slotIndex: 1, ofId: "of-003", machineId: "mch-03", articleId: "art-003", inspector: "Nadia El Fassi", status: "submitted", ncIndexes: [4], outMeasure: 2, waste: 8.2, counter: 38050 },
  { id: "insp-0905", date: "2026-08-22", slotIndex: 4, ofId: "of-001", machineId: "mch-01", articleId: "art-001", inspector: "Youssef Amrani", status: "submitted", waste: 2.9, counter: 118900 },
  { id: "insp-0906", date: "2026-08-22", slotIndex: 3, ofId: "of-002", machineId: "mch-02", articleId: "art-002", inspector: "Imane Tazi", status: "submitted", ncIndexes: [0], waste: 7.0, counter: 82600 },
  { id: "insp-0907", date: "2026-08-22", slotIndex: 2, ofId: "of-003", machineId: "mch-03", articleId: "art-003", inspector: "Nadia El Fassi", status: "submitted", waste: 3.4, counter: 35400 },
];

function build(seed: Seed, index: number): Inspection {
  const checks = buildChecks(seed.articleId, index * 13 + 3, seed.ncIndexes ?? []);
  const measurements = buildMeasurements(seed.articleId, index * 29 + 5, seed.outMeasure ?? -1);
  const all = [...checks.map((c) => c.result), ...measurements.map((m) => m.result)];
  const ncCount = all.filter((r) => r === "NC").length;
  const conformityRate = Math.round(((all.length - ncCount) / all.length) * 1000) / 10;

  return {
    id: seed.id,
    date: seed.date,
    slot: timeSlots[seed.slotIndex],
    ofId: seed.ofId,
    machineId: seed.machineId,
    articleId: seed.articleId,
    inspector: seed.inspector,
    status: seed.status,
    checks,
    measurements,
    production: {
      panneMachine: seed.waste > 7,
      panneMachineMinutes: seed.waste > 7 ? 14 : 0,
      nettoyage: index % 3 === 0,
      manqueMatiere: seed.waste > 8,
      manquePersonnel: false,
      ouvrier: seed.machineId === "mch-01" ? "Youssef Amrani" : seed.machineId === "mch-02" ? "Karim Haddad" : "Imane Tazi",
      regleur: index % 2 === 0 ? "Mehdi Ouazzani" : "Rachid Belkacem",
      compteurMachine: seed.counter,
      quantiteDechets: seed.waste,
      natureDechets: wasteNatures[index % wasteNatures.length],
      cycle: Number((18 + seeded(index) * 4).toFixed(1)),
      poids: Number((42 + seeded(index + 11) * 5).toFixed(1)),
    },
    conformityRate,
    ncCount,
    waste: seed.waste,
  };
}

export const mockInspections: Inspection[] = seeds.map(build);
