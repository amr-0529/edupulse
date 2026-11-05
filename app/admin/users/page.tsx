import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { setActiveAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/format";

type U = { 
  id: string; 
  full_name: string; 
  email: string; 
  role: string; 
  is_active: boolean; 
  approval_status: string | null; 
  created_at: string 
};

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireRole("admin");
  const sp = await searchParams;
  const q = sp.q ?? "";
  
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users", { p_search: q });
  const users = (data ?? []) as U[];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Users</h1>
      
      <form method="get" className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} maxLength={100} className="w-full max-w-xs rounded-xl border border-line bg-card px-3 py-2 outline-none focus:border-brand" placeholder="Search name or email" />
        <button className="btn" type="submit">Search</button>
      </form>
      
      {error && <p className="field-error mt-3" role="alert">Users could not be loaded. Please refresh.</p>}
      
      <div className="mt-4 overflow-x-auto">
        {users.length === 0 && !error ? (
          <div className="card text-center">
            <p className="font-semibold">No users match your search</p>
          </div>
        ) : (
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Status</th>
                <th className="p-2">Joined</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="p-2 font-semibold">{u.full_name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}{u.role === "mentor" && u.approval_status ? ` (${u.approval_status})` : ""}</td>
                  <td className="p-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_active ? "bg-soft text-brand" : "bg-soft text-danger"}`}>
                      {u.is_active ? "active" : "deactivated"}
                    </span>
                  </td>
                  <td className="p-2">{formatDate(u.created_at)}</td>
                  <td className="p-2">
                    {u.id !== me.id && (
                      u.is_active ? (
                        <ActionButton variant="danger" label="Deactivate" pendingLabel="…" confirmText={`Deactivate ${u.full_name}? They will no longer be able to log in.`} action={setActiveAction.bind(null, u.id, false)} />
                      ) : (
                        <ActionButton variant="outline" label="Reactivate" pendingLabel="…" action={setActiveAction.bind(null, u.id, true)} />
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}