import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Avatar } from "@/components/Shell";
import { ReportUser } from "@/components/session-ui";
import { formatDate } from "@/lib/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UniversalProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireRole("student").catch(() => requireRole("mentor")).catch(() => requireRole("admin"));
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  
  // RLS ensures we can only see this profile if we are connected or if it's public (mentors)
  const { data: pr } = await supabase.from("profiles").select("id, role, full_name, avatar_path").eq("id", id).maybeSingle();
  if (!pr) notFound();

  let details: any = null;
  if (pr.role === "student") {
    const { data } = await supabase.from("student_profiles").select("*").eq("id", id).maybeSingle();
    details = data;
  } else if (pr.role === "mentor") {
    const { data } = await supabase.from("mentor_profiles").select("*, categories(name)").eq("id", id).maybeSingle();
    details = data;
  }

  return (
    <>
      <div className="mb-4">
        <Link href={me.role === "student" ? "/student/dashboard" : "/mentor/dashboard"} className="text-sm text-brand underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="flex items-center gap-4 border-b border-line pb-4">
          <Avatar name={pr.full_name} path={pr.avatar_path} size={72} />
          <div>
            <h1 className="text-2xl font-extrabold">{pr.full_name}</h1>
            <p className="text-sm font-semibold text-brand capitalize">{pr.role}</p>
          </div>
        </div>

        <div className="mt-4">
          {pr.role === "student" && details && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Institution</dt><dd>{details.institution || "—"}</dd></div>
              <div><dt className="text-muted">Field of Study</dt><dd>{details.field_of_study || "—"}</dd></div>
              <div><dt className="text-muted">Year</dt><dd>{details.year_of_study || "—"}</dd></div>
              <div><dt className="text-muted">Interests</dt><dd>{details.interests || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted">Bio</dt><dd className="whitespace-pre-wrap">{details.bio || "No bio provided."}</dd></div>
            </dl>
          )}

          {pr.role === "mentor" && details && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Headline</dt><dd>{details.headline || "—"}</dd></div>
              <div><dt className="text-muted">Role</dt><dd>{[details.job_title, details.organisation].filter(Boolean).join(" at ") || "—"}</dd></div>
              <div><dt className="text-muted">Experience</dt><dd>{details.years_experience} years</dd></div>
              <div><dt className="text-muted">Field</dt><dd>{details.categories?.name || details.custom_category || "—"}</dd></div>
              {details.linkedin_url && (
                <div className="sm:col-span-2">
                  <dt className="text-muted">LinkedIn</dt>
                  <dd><a href={details.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{details.linkedin_url}</a></dd>
                </div>
              )}
              <div className="sm:col-span-2"><dt className="text-muted">Bio</dt><dd className="whitespace-pre-wrap">{details.bio || "No bio provided."}</dd></div>
            </dl>
          )}
        </div>

        {pr.id !== me.id && (
          <div className="mt-6 border-t border-line pt-4">
            <ReportUser userId={pr.id} name={pr.full_name} />
          </div>
        )}
      </div>
    </>
  );
}