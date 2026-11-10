import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileForm } from "@/components/forms";
import { AvatarUploader } from "@/components/session-ui";

export default async function StudentProfile() {
  const me = await requireRole("student");
  const supabase = await createClient();
  
  const [{ data }, { data: pr }, { data: cats }] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("id", me.id).single(),
    supabase.from("profiles").select("avatar_path").eq("id", me.id).single(),
    supabase.from("categories").select("name").eq("is_active", true).order("name"),
  ]);
  
  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">My profile</h1>
      <AvatarUploader userId={me.id} name={me.full_name} path={pr?.avatar_path ?? null} />
      <StudentProfileForm 
        fields={(cats ?? []).map((c) => c.name)} 
        initial={{
          fullName: me.full_name, 
          institution: data?.institution ?? "", 
          fieldOfStudy: data?.field_of_study ?? "",
          yearOfStudy: data?.year_of_study ?? "", 
          interests: data?.interests ?? "", 
          bio: data?.bio ?? "",
        }} 
      />
    </>
  );
}