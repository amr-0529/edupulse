export type Role = "student" | "mentor" | "admin";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  is_active: boolean;
}

export type ConnectionStatus = "pending" | "accepted" | "declined";

export interface ActionState {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export const initialState: ActionState = { ok: false };

export const HOME_BY_ROLE: Record<Role, string> = {
  student: "/student/dashboard",
  mentor: "/mentor/dashboard",
  admin: "/admin/dashboard",
};