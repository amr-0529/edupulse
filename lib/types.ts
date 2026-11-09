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
  avg_rating: number | null;
  review_count: number;
  avatar_path: string | null;
}

export type ConnectionStatus = "pending" | "accepted" | "declined" | "removed";
export type SessionStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export interface SessionRow {
  id: string;
  slot_id: string | null;
  student_id: string;
  mentor_id: string;
  starts_at: string;
  ends_at: string;
  topic_note: string;
  status: SessionStatus;
  meeting_link: string | null;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  session_id: string;
  student_id: string;
  mentor_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ActionState {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  code?: string;
}

export const initialState: ActionState = { ok: false };

export const HOME_BY_ROLE: Record<Role, string> = {
  student: "/student/dashboard",
  mentor: "/mentor/dashboard",
  admin: "/admin/dashboard",
};