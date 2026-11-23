"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { fieldErrorsFrom, isOwnAvatarPath, mentorProfileSchema, parseSkills, studentProfileSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function updateStudentProfile(_p: ActionState, fd: FormData): Promise<ActionState> {
  const values = Object.fromEntries(fd.entries()) as Record<string, string>;
  const parsed = studentProfileSchema.safeParse({
    fullName: values.fullName, institution: values.institution, fieldOfStudy: values.fieldOfStudy,
    yearOfStudy: values.yearOfStudy, interests: values.interests, bio: values.bio ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values };
  const v = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in first.", values };

  const a = await supabase.from("profiles").update({ full_name: v.fullName }).eq("id", user.id).select("id");
  if (a.error) return { ok: false, error: `Profile save failed: ${a.error.message}`, values };
  if (!a.data || a.data.length === 0) return { ok: false, error: "Failed to update profile. RLS blocked the update.", values };

  const b = await supabase.from("student_profiles")
    .update({ institution: v.institution, field_of_study: v.fieldOfStudy, year_of_study: v.yearOfStudy, interests: v.interests, bio: v.bio })
    .eq("id", user.id).select("id");
  if (b.error) return { ok: false, error: `Student profile save failed: ${b.error.message}`, values };
  if (!b.data || b.data.length === 0) return { ok: false, error: "Failed to update student profile. RLS blocked the update.", values };

  revalidatePath("/student", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function updateMentorProfile(_p: ActionState, fd: FormData): Promise<ActionState> {
  const values = Object.fromEntries(fd.entries()) as Record<string, string>;
  const parsed = mentorProfileSchema.safeParse({
    fullName: values.fullName, headline: values.headline, jobTitle: values.jobTitle ?? "",
    organisation: values.organisation ?? "", education: values.education ?? "",
    yearsExperience: values.yearsExperience, categoryId: values.categoryId, customCategory: values.customCategory, linkedinUrl: values.linkedinUrl,
    skills: parseSkills(String(values.skills ?? "")), bio: values.bio ?? "",
    acceptingStudents: values.acceptingStudents === "on",
  });
  
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  
  const v = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in first.", values };

  const a = await supabase.from("profiles").update({ full_name: v.fullName }).eq("id", user.id).select("id");
  if (a.error) return { ok: false, error: `Profile save failed: ${a.error.message}`, values };

  const catId = v.categoryId === "custom" ? null : v.categoryId;

  const b = await supabase.from("mentor_profiles").update({
    headline: v.headline, job_title: v.jobTitle, organisation: v.organisation, education: v.education,
    years_experience: v.yearsExperience, skills: v.skills, bio: v.bio, category_id: catId,
    custom_category: v.categoryId === "custom" ? v.customCategory : null,
    linkedin_url: v.linkedinUrl || null,
    accepting_students: v.acceptingStudents,
  }).eq("id", user.id).select("id");

  if (b.error) {
    // THIS WILL SHOW THE EXACT DATABASE ERROR ON THE SCREEN
    return { ok: false, error: `Database Error: ${b.error.message} (Code: ${b.error.code})`, values };
  }
  
  if (!b.data || b.data.length === 0) {
    return { ok: false, error: "Failed to save. The database rejected the update. Check column permissions.", values };
  }

  revalidatePath("/mentor", "layout");
  return { ok: true, message: "Profile saved successfully!" };
}

export async function setAvatarAction(path: string | null): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in first." };
  if (path !== null && !isOwnAvatarPath(user.id, path)) return { ok: false, error: "Invalid image." };
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) return { ok: false, error: friendlyError(error) };
  if (old?.avatar_path && old.avatar_path !== path) await supabase.storage.from("avatars").remove([old.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: path ? "Photo updated." : "Photo removed." };
}