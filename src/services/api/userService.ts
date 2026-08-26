import type { User } from "@/types";
import { mockUsers } from "@/data/mock/users";
import { delay } from "./client";

let users: User[] = [...mockUsers];

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** GET/POST/PUT /users */
export const userService = {
  async list(): Promise<User[]> {
    return delay(users);
  },
  async create(input: Pick<User, "name" | "email" | "role">): Promise<User> {
    const user: User = {
      id: `usr-${Math.random().toString(36).slice(2, 7)}`,
      status: "active",
      lastLogin: null,
      avatarInitials: initials(input.name),
      ...input,
    };
    users = [user, ...users];
    return delay(user);
  },
  async update(id: string, patch: Partial<User>): Promise<User> {
    users = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    return delay(users.find((u) => u.id === id)!);
  },
  async toggleStatus(id: string): Promise<User> {
    const current = users.find((u) => u.id === id)!;
    return this.update(id, { status: current.status === "active" ? "inactive" : "active" });
  },
};
