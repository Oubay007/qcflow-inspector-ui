/**
 * Domain types for QC Flow.
 * These mirror the payloads the future Python/FastAPI backend will return,
 * so swapping the mock services for REST calls requires no UI changes.
 */

export type UserRole = "admin" | "quality_engineer" | "operator" | "supervisor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin: string | null;
  avatarInitials: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export type MachineStatus = "running" | "stopped" | "maintenance" | "warning";

export interface Machine {
  id: string;
  code: string;
  name: string;
  status: MachineStatus;
  location: string;
  currentOfId: string | null;
  currentArticleId: string | null;
  currentOperator: string | null;
  lastInspectionAt: string | null;
  nextInspectionAt: string | null;
  qcStatus: "conforme" | "non_conforme" | "pending";
  downtimeMinutesToday: number;
  problems: MachineProblem[];
}

export interface MachineProblem {
  id: string;
  label: string;
  at: string;
  durationMinutes: number;
  severity: "low" | "medium" | "high";
}

export type CheckResult = "C" | "NC";

export interface ArticleCheck {
  id: string;
  articleId: string;
  label: string;
  order: number;
  required: boolean;
}

export interface ArticleMeasurement {
  id: string;
  articleId: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  order: number;
}

export interface Article {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "active" | "archived";
  checks: ArticleCheck[];
  measurements: ArticleMeasurement[];
}

export type OfStatus = "planned" | "in_progress" | "paused" | "completed";

export interface ProductionOrder {
  id: string;
  number: string;
  articleId: string;
  machineId: string;
  startingProduct: string;
  plannedQuantity: number;
  producedQuantity: number;
  startDate: string;
  status: OfStatus;
  operator: string;
  regleur: string;
}

export interface InspectionCheck {
  checkId: string;
  label: string;
  result: CheckResult | null;
  comment?: string;
  defectType?: string;
}

export interface InspectionMeasurement {
  measurementId: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  actual: number | null;
  result: CheckResult | null;
}

export interface ProductionData {
  panneMachine: boolean;
  panneMachineMinutes: number;
  nettoyage: boolean;
  manqueMatiere: boolean;
  manquePersonnel: boolean;
  ouvrier: string;
  regleur: string;
  compteurMachine: number | null;
  quantiteDechets: number | null;
  natureDechets: string;
  cycle: number | null;
  poids: number | null;
}

export type InspectionStatus = "draft" | "submitted" | "pending" | "upcoming";

export interface TimeSlot {
  id: string;
  start: string; // "10:00"
  end: string; // "12:00"
}

export interface Inspection {
  id: string;
  date: string; // ISO date
  slot: TimeSlot;
  ofId: string;
  machineId: string;
  articleId: string;
  inspector: string;
  status: InspectionStatus;
  checks: InspectionCheck[];
  measurements: InspectionMeasurement[];
  production: ProductionData;
  conformityRate: number;
  ncCount: number;
  waste: number;
}

export interface KpiSummary {
  inspectionsToday: number;
  inspectionsPlanned: number;
  conformityRate: number;
  conformityDelta: number;
  nonConformities: number;
  totalWaste: number;
  productionQuantity: number;
  activeOfs: number;
}

export interface TrendPoint {
  label: string;
  conforme: number;
  nonConforme: number;
  waste: number;
  production: number;
}

export interface DefectPoint {
  label: string;
  value: number;
}

export interface AnalyticsData {
  trend: TrendPoint[];
  defects: DefectPoint[];
  topNcChecks: DefectPoint[];
  measurementDeviations: { label: string; deviation: number; tolerance: number }[];
  completionRate: number;
  conformityRate: number;
  ncTrend: { label: string; value: number }[];
}

export interface ReportSummary {
  period: string;
  production: number;
  waste: number;
  wasteRate: number;
  conformityRate: number;
  ncCount: number;
  inspectionCompletion: number;
  defects: DefectPoint[];
  machineProblems: DefectPoint[];
  measurementDeviations: { label: string; deviation: number; tolerance: number }[];
}

export interface ReportFilters {
  type: "daily" | "weekly" | "monthly";
  ofId?: string;
  machineId?: string;
  articleId?: string;
  from?: string;
  to?: string;
}

export interface AnalyticsFilters {
  machineId?: string;
  articleId?: string;
  ofId?: string;
  range?: "7d" | "30d" | "90d";
}
