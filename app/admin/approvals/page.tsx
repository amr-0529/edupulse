import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { one } from "@/lib/queries";
import { ActionButton } from "@/components/ActionButton";
import { Avatar, Badge, Empty } from "@/components/Shell";
import { reviewMentorAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/format";

type Row = {
  id: string; headline: string; job_title: string; organisation: string; education: string; years_experience: number;
  skills: string[]; bio: string; approval_status: string; reviewed_at: string | null; linkedin_url: string | null; custom_category: string | null;
  profile: { full_name: string } | { full_name: string }[] | null; category: { name: string } | { name: string }[] | null;
};

export default async function Approvals() {
  await requireRole("admin");
  const supabase = await createClient();
  
  const { data, error } = await supabase.from("mentor_profiles")
    .select("id, headline, job_title, organisation, education, years_experience, skills, bio, approval_status, reviewed_at, linkedin_url, custom_category, profile:profiles!mentor_profiles_id_fkey(full_name), category:categories(name)")
    .order("created_at", { ascending: false });
    
  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.approval_status === "pending");
  const reviewed = rows.filter((r) => r.approval_status !== "pending");

  return (
    <>
      <h1 className="text-3xl font-extrabold">Mentor approvals</h1>
      
      {error && <p className="field-error mt-3" role="alert">Mentors could not be loaded. Please refresh.</p>}
      
      <div className="mt-4 space-y-3">
        {pending.length === 0 && !error && (
          <Empty title="No mentors waiting for review" />
        )}
        
        {pending.map((r) => {
          const name = one(r.profile)?.full_name ?? "Mentor";
          const complete = !!r.headline.trim() && r.skills.length > 0 && !!(one(r.category) || r.custom_category) && !!r.linkedin_url;
          
          return (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold flex items-center gap-2">
                    {name} 
                    {!complete && <Badge tone="warn">Profile incomplete - wait for mentor</Badge>}
                  </p>
                  <p className="text-sm text-muted">{r.headline || "No headline yet"}</p>
                  <p className="text-sm text-muted">
                    {[r.job_title, r.organisation].filter(Boolean).join(" at ") || "No role given"} · {r.years_experience} yrs · {r.education || "No education given"}
                  </p>
                  
                  <div className="mt-1">
                    {one(r.category) && <span className="chip">{one(r.category)!.name}</span>}
                    {r.custom_category && <span className="chip">{r.custom_category}</span>}
                    {r.skills.map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                  
                  {r.bio && <p className="mt-2 text-sm">{r.bio}</p>}
                  
                  {r.linkedin_url ? (
                    <p className="mt-2 text-sm">
                      <b>LinkedIn:</b> <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{r.linkedin_url}</a>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-danger">Missing LinkedIn Profile</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <ActionButton label="Approve" pendingLabel="Approving…" action={reviewMentorAction.bind(null, r.id, "approved")} />
                  <ActionButton label="Reject" variant="danger" confirmText={`Reject ${name}?`} action={reviewMentorAction.bind(null, r.id, "rejected")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviewed.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold">Reviewed</h2>
          <div className="mt-3 space-y-2">
            {reviewed.map((r) => (
              <div key={r.id} className="card flex items-center justify-between py-3">
                <span>{one(r.profile)?.full_name}</span>
                <span className="flex items-center gap-3">
                  <Badge tone={r.approval_status === "approved" ? "ok" : "bad"}>{r.approval_status}</Badge>
                  <span className="text-xs text-muted">{r.reviewed_at ? formatDate(r.reviewed_at) : ""}</span>
                  {r.approval_status === "rejected" ? (
                    <ActionButton variant="outline" label="Approve" action={reviewMentorAction.bind(null, r.id, "approved")} />
                  ) : (
                    <ActionButton variant="outline" label="Revoke" confirmText="Remove this mentor from discovery?" action={reviewMentorAction.bind(null, r.id, "rejected")} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}