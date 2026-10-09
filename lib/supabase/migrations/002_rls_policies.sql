-- EduPulse 002: Row Level Security, grants and RPC functions (FR-02.3, NFR-04/05)

-- ---------------------------------------------------------------- policy helpers
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- ---------------------------------------------------------------- enable RLS everywhere
alter table public.categories         enable row level security;
alter table public.profiles           enable row level security;
alter table public.student_profiles   enable row level security;
alter table public.mentor_profiles    enable row level security;
alter table public.connections        enable row level security;
alter table public.messages           enable row level security;
alter table public.availability_slots enable row level security;

-- ---------------------------------------------------------------- privileges (least privilege)
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;

grant select on public.categories, public.profiles, public.student_profiles,
                public.mentor_profiles, public.connections, public.messages,
                public.availability_slots, public.mentor_directory to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant update (institution, field_of_study, year_of_study, interests, bio)
  on public.student_profiles to authenticated;
grant update (headline, job_title, organisation, education, years_experience,
              skills, bio, category_id, accepting_students)
  on public.mentor_profiles to authenticated;
grant delete on public.connections to authenticated;
grant insert (connection_id, sender_id, body) on public.messages to authenticated;
grant insert (mentor_id, starts_at, ends_at) on public.availability_slots to authenticated;
grant delete on public.availability_slots to authenticated;

grant execute on function public.current_user_role(), public.is_admin() to authenticated;

-- ---------------------------------------------------------------- policies
-- categories
create policy categories_read on public.categories for select to authenticated using (true);

-- profiles: own row, admin, mentors (visible to students/admin), or a connected counterpart
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or (role = 'mentor' and public.current_user_role() = 'student')
  or exists (select 1 from public.connections c
             where (c.student_id = auth.uid() and c.mentor_id = profiles.id)
                or (c.mentor_id  = auth.uid() and c.student_id = profiles.id))
);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- student_profiles
create policy student_profiles_read on public.student_profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.connections c
             where c.mentor_id = auth.uid() and c.student_id = student_profiles.id)
);
create policy student_profiles_update_own on public.student_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- mentor_profiles: own, admin, or approved (students only)
create policy mentor_profiles_read on public.mentor_profiles for select to authenticated using (
  (id = auth.uid() and public.current_user_role() is not null)
  or public.is_admin()
  or (approval_status = 'approved' and public.current_user_role() = 'student')
);
create policy mentor_profiles_update_own on public.mentor_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- connections: participants and admin read; student may cancel (delete) own pending request.
-- Inserts and status changes happen ONLY through the RPC functions below.
-- Every data policy below also requires an ACTIVE account (current_user_role() is null for deactivated users).
create policy connections_read on public.connections for select to authenticated using (
  public.current_user_role() is not null
  and (student_id = auth.uid() or mentor_id = auth.uid() or public.is_admin())
);
create policy connections_cancel_pending on public.connections for delete to authenticated using (
  public.current_user_role() = 'student' and student_id = auth.uid() and status = 'pending'
);

-- messages: only the two participants of an ACCEPTED connection (FR-09.1)
create policy messages_read on public.messages for select to authenticated using (
  public.current_user_role() is not null and exists (select 1 from public.connections c
          where c.id = messages.connection_id
            and (c.student_id = auth.uid() or c.mentor_id = auth.uid()))
);
create policy messages_send on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.current_user_role() is not null
  and exists (select 1 from public.connections c
              where c.id = messages.connection_id and c.status = 'accepted'
                and (c.student_id = auth.uid() or c.mentor_id = auth.uid()))
);

-- availability: mentor manages own; connected students see OPEN future slots (FR-06.4)
create policy slots_read on public.availability_slots for select to authenticated using (
  (mentor_id = auth.uid() and public.current_user_role() is not null)
  or public.is_admin()
  or (status = 'open' and ends_at > now()
      and exists (select 1 from public.connections c
                  where c.student_id = auth.uid() and c.mentor_id = availability_slots.mentor_id
                    and c.status = 'accepted'))
);
create policy slots_insert_own on public.availability_slots for insert to authenticated with check (
  mentor_id = auth.uid() and public.current_user_role() = 'mentor'
);
create policy slots_delete_own_open on public.availability_slots for delete to authenticated using (
  mentor_id = auth.uid() and status = 'open'
);

-- ---------------------------------------------------------------- RPC functions
-- FR-07.1/07.2/07.4: send a connection request
create or replace function public.send_connection_request(p_mentor_id uuid, p_message text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_msg  text := btrim(coalesce(p_message, ''));
  v_last public.connections%rowtype;
  v_id   uuid;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  if public.current_user_role() <> 'student' then
    raise exception 'Only students can send connection requests.';
  end if;
  if p_mentor_id = auth.uid() then raise exception 'You cannot connect with yourself.'; end if;
  if char_length(v_msg) > 300 then raise exception 'Message must be 300 characters or fewer.'; end if;

  if not exists (
    select 1 from public.mentor_profiles m join public.profiles p on p.id = m.id
    where m.id = p_mentor_id and p.is_active and p.role = 'mentor'
      and m.approval_status = 'approved' and m.accepting_students
  ) then
    raise exception 'This mentor is not available for new connections.';
  end if;

  select * into v_last from public.connections
   where student_id = auth.uid() and mentor_id = p_mentor_id
   order by created_at desc limit 1;

  if found then
    if v_last.status = 'pending'  then raise exception 'You already sent a request to this mentor.'; end if;
    if v_last.status = 'accepted' then raise exception 'You are already connected with this mentor.'; end if;
    if v_last.status = 'declined' and v_last.responded_at > now() - interval '7 days' then
      raise exception 'This mentor declined your last request. You can send a new request after %.',
        to_char((v_last.responded_at + interval '7 days') at time zone 'Asia/Colombo', 'DD Mon YYYY');
    end if;
  end if;

  insert into public.connections(student_id, mentor_id, intro_message)
  values (auth.uid(), p_mentor_id, v_msg) returning id into v_id;
  return v_id;
end $$;

-- FR-08.2: mentor accepts or declines
create or replace function public.respond_connection(p_connection_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.connections
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = p_connection_id and mentor_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'This request was already answered or was cancelled. Please refresh.';
  end if;
end $$;

-- FR-09.6: mark the other person's messages as read
create or replace function public.mark_conversation_read(p_connection_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.messages m set read_at = now()
   where m.connection_id = p_connection_id and m.sender_id <> auth.uid() and m.read_at is null
     and exists (select 1 from public.connections c
                 where c.id = p_connection_id and (c.student_id = auth.uid() or c.mentor_id = auth.uid()));
$$;

-- FR-15.6: admin approves / rejects a mentor
create or replace function public.admin_review_mentor(p_mentor_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision.'; end if;
  update public.mentor_profiles
     set approval_status = p_decision, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_mentor_id;
  if not found then raise exception 'Mentor not found.'; end if;
end $$;

-- FR-15.3: admin deactivates / reactivates (not self)
create or replace function public.admin_set_active(p_user_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot change your own account status.'; end if;
  update public.profiles set is_active = p_active where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
end $$;

-- FR-15.2: admin user list (email lives in auth.users, so it is exposed only through this guarded function)
create or replace function public.admin_list_users(p_search text default '')
returns table (id uuid, full_name text, email text, role text, is_active boolean,
               approval_status text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_q text := '%' || replace(replace(btrim(coalesce(p_search,'')), '%', ''), '_', '') || '%';
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  return query
    select p.id, p.full_name, u.email::text, p.role, p.is_active, m.approval_status, p.created_at
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.mentor_profiles m on m.id = p.id
     where p.full_name ilike v_q or u.email ilike v_q
     order by p.created_at desc limit 200;
end $$;

grant execute on function
  public.send_connection_request(uuid, text), public.respond_connection(uuid, boolean),
  public.mark_conversation_read(uuid), public.admin_review_mentor(uuid, text),
  public.admin_set_active(uuid, boolean), public.admin_list_users(text)
  to authenticated;

-- ---------------------------------------------------------------- realtime (FR-09.4)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
