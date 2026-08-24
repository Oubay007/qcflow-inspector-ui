import type { Machine } from "@/types";
import { mockMachines } from "@/data/mock/machines";
import { delay } from "./client";

/** GET /machines, GET /machines/:id */
export const machineService = {
  async list(): Promise<Machine[]> {
    return delay(mockMachines);
  },
  async get(id: string): Promise<Machine | null> {
    return delay(mockMachines.find((m) => m.id === id) ?? null);
  },
  async getByCode(code: string): Promise<Machine | null> {
    const normalized = code.trim().toUpperCase().replace(/\s+/g, "-");
    return delay(
      mockMachines.find((m) => m.code.toUpperCase() === normalized || m.name.toUpperCase() === code.trim().toUpperCase()) ?? null,
      500,
    );
  },
};
