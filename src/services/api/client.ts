/**
 * Thin HTTP client placeholder.
 *
 * Today every service resolves from mock data. When the Python/FastAPI backend
 * is ready, set VITE_API_BASE_URL and replace the mock bodies in each service
 * with `apiRequest<T>(...)` calls — no UI component needs to change.
 */

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export const endpoints = {
  login: "/auth/login",
  me: "/users/me",
  users: "/users",
  ofs: "/ofs",
  of: (id: string) => `/ofs/${id}`,
  machines: "/machines",
  machine: (id: string) => `/machines/${id}`,
  articles: "/articles",
  article: (id: string) => `/articles/${id}`,
  articleChecks: (id: string) => `/articles/${id}/checks`,
  articleMeasurements: (id: string) => `/articles/${id}/measurements`,
  inspections: "/inspections",
  inspection: (id: string) => `/inspections/${id}`,
  inspectionChecks: (id: string) => `/inspections/${id}/checks`,
  inspectionMeasurements: (id: string) => `/inspections/${id}/measurements`,
  reportsDaily: "/reports/daily",
  reportsWeekly: "/reports/weekly",
  reportsMonthly: "/reports/monthly",
  analytics: "/analytics",
} as const;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return (await res.json()) as T;
}

/** Simulates realistic network latency for the mock layer. */
export function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
