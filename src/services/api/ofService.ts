import type { ProductionOrder } from "@/types";
import { mockOfs } from "@/data/mock/ofs";
import { delay } from "./client";

let ofs: ProductionOrder[] = [...mockOfs];

/** GET/POST /ofs, GET/PUT /ofs/:id */
export const ofService = {
  async list(): Promise<ProductionOrder[]> {
    return delay(ofs);
  },
  async get(id: string): Promise<ProductionOrder | null> {
    return delay(ofs.find((o) => o.id === id) ?? null);
  },
  async create(input: Omit<ProductionOrder, "id">): Promise<ProductionOrder> {
    const of: ProductionOrder = { ...input, id: `of-${Math.random().toString(36).slice(2, 7)}` };
    ofs = [of, ...ofs];
    return delay(of);
  },
  async update(id: string, patch: Partial<ProductionOrder>): Promise<ProductionOrder> {
    ofs = ofs.map((o) => (o.id === id ? { ...o, ...patch } : o));
    return delay(ofs.find((o) => o.id === id)!);
  },
};
