import type { AuthSession, User } from "@/types";
import { mockUsers } from "@/data/mock/users";
import { delay } from "@/services/api/client";

const STORAGE_KEY = "qcflow.session";

/**
 * Mock authentication. Later: POST /auth/login + GET /users/me.
 * Any password is accepted; the email decides the role (falls back to the
 * default quality engineer account).
 */
export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    if (!email || !password) throw new Error("Email and password are required.");
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? mockUsers[0]!;
    if (user.status === "inactive") throw new Error("This account is deactivated. Contact your administrator.");
    const session: AuthSession = { token: `mock.${btoa(user.id)}.token`, user: { ...user, lastLogin: new Date().toISOString() } };
    await delay(null, 550);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  logout(): void {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  },

  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  async me(): Promise<User | null> {
    return delay(this.getSession()?.user ?? null, 100);
  },

  async listUsers(): Promise<User[]> {
    return delay(mockUsers);
  },

  async requestPasswordReset(email: string): Promise<void> {
    await delay(null, 400);
    if (!email) throw new Error("Enter your email first.");
  },
};
