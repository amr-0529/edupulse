// Creates DEMO accounts through the Supabase Admin API so the database trigger builds their profiles.
// Run locally ONLY:  npm run seed:demo      (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
// The service-role key is read from the environment here and is never used by the web app.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const PASSWORD = "Password1"; // demo only - change/delete these accounts after the presentation

const students = [
  ["alex@edupulse.lk", "Alex Perera", { institution: "University of Moratuwa", field_of_study: "Software Engineering", year_of_study: "3rd year", interests: "Web development, cloud", bio: "Aspiring full-stack developer looking for industry guidance." }],
  ["nimali@edupulse.lk", "Nimali Silva", { institution: "University of Colombo", field_of_study: "Data Science", year_of_study: "2nd year", interests: "Machine learning", bio: "Curious about data careers." }],
];
const mentors = [
  ["sarah@edupulse.lk", "Sarah Fernando", "Software Engineering", "Senior Software Engineer", "WSO2", 5, ["React", "Node.js", "System Design", "Career Planning"], "I help students move from coursework to real-world web engineering.", "approved"],
  ["daniel@edupulse.lk", "Daniel Perera", "UI/UX Design", "Product Designer", "PickMe", 4, ["Figma", "User Research", "Prototyping"], "Product designer helping beginners build a strong portfolio.", "approved"],
  ["nadeesha@edupulse.lk", "Nadeesha Silva", "Data Science", "Data Analyst", "Dialog Axiata", 6, ["Python", "SQL", "Power BI"], "I mentor students entering analytics roles.", "approved"],
  ["ayesha@edupulse.lk", "Ayesha Rahman", "Business", "Startup Founder", "Ceylon Labs", 10, ["Entrepreneurship", "Fundraising"], "Founder mentoring early-stage student entrepreneurs.", "pending"],
];

async function mk(email, full_name, role) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name, role } });
  if (error) {
    if (/already/i.test(error.message)) { console.log("exists:", email); const { data: l } = await admin.auth.admin.listUsers({ perPage: 200 }); return l.users.find((u) => u.email === email)?.id; }
    throw error;
  }
  console.log("created:", email); return data.user.id;
}

const { data: cats } = await admin.from("categories").select("id,name");
const cat = (n) => cats.find((c) => c.name === n)?.id;

for (const [email, name, sp] of students) { const id = await mk(email, name, "student"); await admin.from("student_profiles").update(sp).eq("id", id); }
for (const [email, name, c, head, org, exp, skills, bio, status] of mentors) {
  const id = await mk(email, name, "mentor");
  await admin.from("mentor_profiles").update({ headline: head, job_title: head, organisation: org, years_experience: exp, skills, bio, category_id: cat(c), approval_status: status }).eq("id", id);
}
// Admin accounts are created ONLY by this controlled process (FR-01.6): the trigger makes them students, we promote here.
const adminId = await mk("admin@edupulse.lk", "Admin User", "student");
await admin.from("student_profiles").delete().eq("id", adminId);
await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);
console.log("\nDone. Demo password for all accounts:", PASSWORD);
