export type Role = "student" | "mentor" | "admin";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

export interface MentorCard {
  id: string;
  full_name: string;
  headline: string;
  job_title: string;
  organisation: string;
  education: string;
  years_experience: number;
  skills: string[];
  bio: string;
  category_id: string;
  category_name: string;
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