import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "usr-1",
    name: "Ahmed Bennani",
    email: "ahmed.bennani@qcflow.io",
    role: "quality_engineer",
    status: "active",
    lastLogin: "2026-08-24T07:42:00Z",
    avatarInitials: "AB",
  },
  {
    id: "usr-2",
    name: "Salma Idrissi",
    email: "salma.idrissi@qcflow.io",
    role: "admin",
    status: "active",
    lastLogin: "2026-08-24T06:10:00Z",
    avatarInitials: "SI",
  },
  {
    id: "usr-3",
    name: "Youssef Amrani",
    email: "youssef.amrani@qcflow.io",
    role: "operator",
    status: "active",
    lastLogin: "2026-08-23T21:05:00Z",
    avatarInitials: "YA",
  },
  {
    id: "usr-4",
    name: "Nadia El Fassi",
    email: "nadia.elfassi@qcflow.io",
    role: "supervisor",
    status: "active",
    lastLogin: "2026-08-24T05:30:00Z",
    avatarInitials: "NE",
  },
  {
    id: "usr-5",
    name: "Karim Haddad",
    email: "karim.haddad@qcflow.io",
    role: "operator",
    status: "inactive",
    lastLogin: "2026-07-19T14:22:00Z",
    avatarInitials: "KH",
  },
  {
    id: "usr-6",
    name: "Imane Tazi",
    email: "imane.tazi@qcflow.io",
    role: "quality_engineer",
    status: "active",
    lastLogin: "2026-08-22T09:12:00Z",
    avatarInitials: "IT",
  },
];

export const roleLabels: Record<User["role"], string> = {
  admin: "Admin",
  quality_engineer: "Quality Engineer",
  operator: "Operator",
  supervisor: "Supervisor",
};
