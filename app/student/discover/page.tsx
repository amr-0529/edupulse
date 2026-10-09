import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sanitizeSearch } from "@/lib/validation";
import type { Category, MentorCard } from "@/lib/types";

const PAGE_SIZE = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { q?: string; cat?: string; min?: string; max?: string; sort?: string; page?: string };

export default async function Discover({ searchParams }: { searchParams: Promise<Params> }) {
  await requireRole("student");
  const sp = await searchParams;
  const supabase = await createClient();

  const q = sanitizeSearch(sp.q ?? "");
  const cat = sp.cat && UUID.test(sp.cat) ? sp.cat : "";
  const min = sp.min ? Math.max(0, parseInt(sp.min, 10) || 0) : null;
  const max = sp.max ? Math.max(0, parseInt(sp.max, 10) || 0) : null;
  const sort = ["newest", "name", "experience"].includes(sp.sort ?? "") ? sp.sort! : "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const rangeError = min !== null && max !== null && min > max ? "Minimum experience cannot be greater than maximum." : null;

  const { data: cats } = await supabase.from("categories").select("id, name, is_active").eq("is_active", true).order("name");

  let mentors: MentorCard[] = [];
  let total = 0;
  let loadError = false;

  if (!rangeError) {
    let query = supabase.from("mentor_directory").select("*", { count: "exact" });
    if (q) query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,category_name.ilike.%${q}%,skills_text.ilike.%${q}%`);
    if (cat) query = query.eq("category_id", cat);
    if (min !== null) query = query.gte("years_experience", min);
    if (max !== null) query = query.lte("years_experience", max);
    query = sort === "name" ? query.order("full_name") : sort === "experience" ? query.order("years_experience", { ascending: false }) : query.order("created_at", { ascending: false });
    const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) loadError = true;
    mentors = (data ?? []) as MentorCard[];
    total = count ?? 0;
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cat) u.set("cat", cat);
    if (min !== null) u.set("min", String(min));
    if (max !== null) u.set("max", String(max));
    if (sort !== "newest") u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/student/discover${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">Find a mentor</h1>

      <form method="get" className="card mt-4 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="label mt-0" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} maxLength={100} className="input" placeholder="Name, skill, role or field" />
        </div>
        <div>
          <label className="label mt-0" htmlFor="cat">Field</label>
          <select id="cat" name="cat" defaultValue={cat} className="input">
            <option value="">All fields</option>
            {((cats ?? []) as Category[]).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mt-0" htmlFor="min">Min years</label>
          <input id="min" name="min" type="number" min={0} max={60} defaultValue={min ?? ""} className="input" />
        </div>
        <div>
          <label className="label mt-0" htmlFor="max">Max years</label>
          <input id="max" name="max" type="number" min={0} max={60} defaultValue={max ?? ""} className="input" />
        </div>
        <div>
          <label className="label mt-0" htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort} className="input">
            <option value="newest">Newest profile</option>
            <option value="name">Name</option>
            <option value="experience">Experience</option>
          </select>
        </div>
        <div className="flex gap-2 md:col-span-6">
          <button className="btn" type="submit">Search</button>
          <Link href="/student/discover" className="btn btn-outline">Clear filters</Link>
        </div>
      </form>

      {rangeError && <p className="field-error mt-4" role="alert">{rangeError}</p>}
      {loadError && (
        <div className="card mt-4 text-center">
          <p className="font-semibold">Mentors could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">Please refresh the page to retry.</p>
        </div>
      )}
      {!rangeError && !loadError && mentors.length === 0 && (
        <div className="card mt-4 text-center">
          <p className="font-semibold">No mentors found</p>
          <p className="mt-2 text-sm text-muted">Try a different keyword or clear the filters.</p>
        </div>
      )}

      {!loadError && (
        <>
          <p className="mt-4 text-sm text-muted">{total} mentor{total === 1 ? "" : "s"} found</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m) => (
              <div key={m.id} className="card flex flex-col">
                <div className="flex items-center gap-3">
                  <div aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-soft text-lg font-bold text-brand">
                    {m.full_name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.full_name}</p>
                    <p className="truncate text-sm text-muted">{m.headline}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {[m.job_title, m.organisation].filter(Boolean).join(" · ")} · {m.years_experience} yrs
                </p>
                <div className="mt-2">
                  <span className="chip">{m.category_name}</span>
                  {m.skills.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
                <Link href={`/student/mentors/${m.id}`} className="btn btn-outline mt-4 self-start">
                  View profile
                </Link>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 ? <Link href={link(page - 1)} className="btn btn-outline btn-sm">Previous</Link> : <span />}
              <span className="text-sm text-muted">Page {page} of {pages}</span>
              {page < pages ? <Link href={link(page + 1)} className="btn btn-outline btn-sm">Next</Link> : <span />}
            </div>
          )}
        </>
      )}
    </>
  );
}