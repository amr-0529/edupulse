import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { CategoryForm } from "@/components/session-ui";
import { setCategoryActiveAction } from "@/app/actions/admin";

export default async function AdminCategories() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, is_active").order("name");
  const cats = data ?? [];
  const { data: used } = await supabase.from("mentor_profiles").select("category_id");
  const usage = new Map<string, number>();
  (used ?? []).forEach((u) => u.category_id && usage.set(u.category_id, (usage.get(u.category_id) ?? 0) + 1));

  return (
    <>
      <h1 className="text-3xl font-extrabold">Mentoring fields (categories)</h1>
      <p className="mt-1 text-sm text-muted">Mentors choose one field. Deactivating a field hides its mentors from discovery until it is reactivated.</p>
      
      <div className="card mt-4">
        <h2 className="mb-2 font-semibold">Add a field</h2>
        <CategoryForm id="new" name="" active />
      </div>
      
      {error && <p className="field-error mt-3" role="alert">Categories could not be loaded. Please refresh.</p>}
      
      <div className="mt-4 space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="flex flex-wrap items-start gap-3">
              <CategoryForm id={c.id} name={c.name} active={c.is_active} />
              <span className="mt-2 text-xs text-muted">{usage.get(c.id) ?? 0} mentor(s)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.is_active ? "bg-soft text-brand" : "bg-soft text-danger"}`}>
                {c.is_active ? "active" : "inactive"}
              </span>
              <ActionButton variant={c.is_active ? "danger" : "outline"} label={c.is_active ? "Deactivate" : "Activate"} pendingLabel="…"
                confirmText={c.is_active ? `Deactivate "${c.name}"? Its mentors will be hidden from discovery.` : undefined}
                action={setCategoryActiveAction.bind(null, c.id, c.name, !c.is_active)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}