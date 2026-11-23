import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MentorProfileForm } from "@/components/forms";
import { AvatarUploader } from "@/components/session-ui";
import type { Category } from "@/lib/types";

export default async function MentorProfile({ searchParams }: { searchParams: Promise<{ incomplete?: string }> }) {
  const sp = await searchParams;
  const me = await requireRole("mentor");
  const supabase = await createClient();
  
  const [{ data: mp }, { data: cats }, { data: pr }] = await Promise.all([
    supabase.from("mentor_profiles").select("*").eq("id", me.id).single(),
    supabase.from("categories").select("id, name, is_active").eq("is_active", true).order("name"),
    supabase.from("profiles").select("avatar_path").eq("id", me.id).single(),
  ]);
  
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-3xl font-extrabold">My profile</h1>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${mp?.approval_status === "approved" ? "bg-soft text-brand" : mp?.approval_status === "rejected" ? "bg-soft text-danger" : "bg-soft text-warn"}`}>
          {mp?.approval_status ?? "pending"}
        </span>
      </div>

      {sp.incomplete === "true" && (
        <div className="card mb-6 border-warn bg-warn/10">
          <h2 className="font-bold text-warn">Action Required: Complete Your Profile</h2>
          <p className="text-sm text-ink mt-1">
            Before you can access the rest of your dashboard and be reviewed by the Admin, you must complete your profile. 
            Ensure you fill in your Headline, Mentoring Field (or custom field), Skills, Bio, and LinkedIn URL.
          </p>
        </div>
      )}
      
      <AvatarUploader userId={me.id} name={me.full_name} path={pr?.avatar_path ?? null} />
      
      <MentorProfileForm
        categories={(cats ?? []) as Category[]}
        initial={{
          fullName: me.full_name, 
          headline: mp?.headline ?? "", 
          jobTitle: mp?.job_title ?? "", 
          organisation: mp?.organisation ?? "",
          education: mp?.education ?? "", 
          yearsExperience: mp?.years_experience ?? 0, 
          categoryId: mp?.category_id ?? (mp?.custom_category ? "custom" : ""),
          customCategory: mp?.custom_category,
          linkedinUrl: mp?.linkedin_url,
          skills: (mp?.skills ?? []).join(", "), 
          bio: mp?.bio ?? "", 
          acceptingStudents: mp?.accepting_students ?? true,
        }}
      />
    </>
  );
}