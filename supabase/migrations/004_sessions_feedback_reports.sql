-- EduPulse 004: sessions, feedback, reports, category admin, connection removal, slot editing, profile photos.

alter table public.connections drop constraint if exists connections_status_check;
alter table public.connections add constraint connections_status_check
  check (status in ('pending','accepted','declined','removed'));
alter table public.connections add column if not exists removed_at timestamptz;

alter table public.profiles add column if not exists avatar_path text
  check (avatar_path is null or char_length(avatar_path) <= 200);

create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  slot_id       uuid references public.availability_slots(id) on delete set null,
  connection_id uuid not null references public.connections(id) on delete cascade,
  student_id    uuid not null constraint sessions_student_id_fkey references public.profiles(id) on delete cascade,
  mentor_id     uuid not null constraint sessions_mentor_id_fkey  references public.profiles(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  topic_note    text not null check (char_length(btrim(topic_note)) between 1 and 500),
  status        text not null default 'pending'
                check (status in ('pending','accepted','declined','cancelled','completed')),
  meeting_link  text check (meeting_link is null
                            or (char_length(meeting_link) <= 300 and meeting_link ~ '^https://[^[:space:]]+$')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at),
  check (student_id <> mentor_id)
);
create unique index sessions_one_active_per_slot on public.sessions(slot_id) where status in ('pending','accepted');
create index sessions_student_idx on public.sessions(student_id, starts_at desc);
create index sessions_mentor_idx  on public.sessions(mentor_id, starts_at desc);
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();

create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  student_id uuid not null constraint feedback_student_id_fkey references public.profiles(id) on delete cascade,
  mentor_id  uuid not null constraint feedback_mentor_id_fkey  references public.profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);
create index feedback_mentor_idx on public.feedback(mentor_id, created_at desc);

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null constraint reports_reporter_id_fkey      references public.profiles(id) on delete cascade,
  reported_user_id uuid not null constraint reports_reported_user_id_fkey references public.profiles(id) on delete cascade,
  reason           text not null check (char_length(btrim(reason)) between 1 and 500),
  status           text not null default 'open' check (status in ('open','resolved')),
  resolved_by      uuid references public.profiles(id),
  resolved_at      timestamptz,
  resolution_note  text not null default '' check (char_length(resolution_note) <= 500),
  created_at       timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);
create unique index reports_one_open_per_pair on public.reports(reporter_id, reported_user_id) where status = 'open';
create index reports_status_idx on public.reports(status, created_at desc);

alter table public.sessions enable row level security;
alter table public.feedback enable row level security;
alter table public.reports  enable row level security;

revoke all on public.sessions, public.feedback, public.reports from anon, authenticated;
grant select on public.sessions, public.feedback, public.reports to authenticated;

create policy sessions_read on public.sessions for select to authenticated using (
  public.current_user_role() is not null
  and (student_id = auth.uid() or mentor_id = auth.uid() or public.is_admin())
);
create policy feedback_read on public.feedback for select to authenticated using (
  public.current_user_role() is not null
  and (student_id = auth.uid() or mentor_id = auth.uid() or public.is_admin())
);
create policy reports_read on public.reports for select to authenticated using (
  public.current_user_role() is not null and (reporter_id = auth.uid() or public.is_admin())
);

grant update (avatar_path) on public.profiles to authenticated;
grant update (starts_at, ends_at) on public.availability_slots to authenticated;
create policy slots_update_own_open on public.availability_slots for update to authenticated
  using (mentor_id = auth.uid() and status = 'open' and public.current_user_role() = 'mentor')
  with check (mentor_id = auth.uid() and status = 'open');
create trigger slots_future_update before update of starts_at, ends_at on public.availability_slots
  for each row when (new.starts_at is distinct from old.starts_at) execute function public.slot_must_be_future();

create view public.mentor_rating_summary as
select f.mentor_id, round(avg(f.rating)::numeric, 1) as avg_rating, count(*)::int as review_count
from public.feedback f
join public.mentor_profiles m on m.id = f.mentor_id and m.approval_status = 'approved'
join public.profiles p on p.id = f.mentor_id and p.is_active
group by f.mentor_id;
revoke all on public.mentor_rating_summary from anon, authenticated;
grant select on public.mentor_rating_summary to authenticated;

create or replace view public.mentor_directory with (security_invoker = true) as
select
  p.id, p.full_name, m.headline, m.job_title, m.organisation, m.education,
  m.years_experience, m.skills, array_to_string(m.skills, ' ') as skills_text,
  m.bio, m.category_id, c.name as category_name, m.created_at,
  s.avg_rating, coalesce(s.review_count, 0) as review_count, p.avatar_path
from public.mentor_profiles m
join public.profiles   p on p.id = m.id
join public.categories c on c.id = m.category_id
left join public.mentor_rating_summary s on s.mentor_id = m.id
where p.is_active and p.role = 'mentor'
  and m.approval_status = 'approved'
  and m.accepting_students
  and c.is_active
  and btrim(m.headline) <> ''
  and cardinality(m.skills) > 0;

create or replace function public.request_session(p_slot_id uuid, p_topic text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_topic text := btrim(coalesce(p_topic, ''));
  v_slot  public.availability_slots%rowtype;
  v_conn  public.connections%rowtype;
  v_id    uuid;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  if public.current_user_role() is distinct from 'student' then raise exception 'Only students can request sessions.'; end if;
  if char_length(v_topic) = 0 then raise exception 'Please add a short note about what you would like to discuss.'; end if;
  if char_length(v_topic) > 500 then raise exception 'The note must be 500 characters or fewer.'; end if;
  select * into v_slot from public.availability_slots where id = p_slot_id for update;
  if not found or v_slot.status <> 'open' or v_slot.starts_at <= now() then raise exception 'This slot is no longer available.'; end if;
  select * into v_conn from public.connections where student_id = auth.uid() and mentor_id = v_slot.mentor_id and status = 'accepted';
  if not found then raise exception 'You need an accepted connection with this mentor.'; end if;
  begin
    insert into public.sessions(slot_id, connection_id, student_id, mentor_id, starts_at, ends_at, topic_note)
    values (v_slot.id, v_conn.id, auth.uid(), v_slot.mentor_id, v_slot.starts_at, v_slot.ends_at, v_topic) returning id into v_id;
  exception when unique_violation then raise exception 'This slot is no longer available.'; end;
  update public.availability_slots set status = 'booked' where id = v_slot.id;
  return v_id;
end $$;

create or replace function public.respond_session(p_session_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v public.sessions%rowtype;
begin
  if public.current_user_role() is distinct from 'mentor' then raise exception 'Only mentors can do this.'; end if;
  select * into v from public.sessions where id = p_session_id and mentor_id = auth.uid() for update;
  if not found then raise exception 'Session not found.'; end if;
  if v.status <> 'pending' then raise exception 'This request was already answered.'; end if;
  if p_accept and v.starts_at <= now() then raise exception 'This session time has already passed.'; end if;
  update public.sessions set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now() where id = v.id;
  if not p_accept then update public.availability_slots set status = 'open' where id = v.slot_id and status = 'booked' and starts_at > now(); end if;
end $$;

create or replace function public.cancel_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.sessions%rowtype;
begin
  if coalesce(public.current_user_role(), '') not in ('student','mentor') then raise exception 'Not allowed.'; end if;
  select * into v from public.sessions where id = p_session_id and (student_id = auth.uid() or mentor_id = auth.uid()) for update;
  if not found then raise exception 'Session not found.'; end if;
  if v.status = 'pending' and v.student_id <> auth.uid() then raise exception 'Decline the request instead of cancelling it.'; end if;
  if v.status not in ('pending','accepted') then raise exception 'This session can no longer be cancelled.'; end if;
  if v.starts_at <= now() then raise exception 'Sessions cannot be cancelled after they have started.'; end if;
  update public.sessions set status = 'cancelled', responded_at = now() where id = v.id;
  update public.availability_slots set status = 'open' where id = v.slot_id and status = 'booked' and starts_at > now();
end $$;

create or replace function public.set_meeting_link(p_session_id uuid, p_link text)
returns void language plpgsql security definer set search_path = public as $$
declare v_link text := nullif(btrim(coalesce(p_link, '')), '');
begin
  if public.current_user_role() is distinct from 'mentor' then raise exception 'Only mentors can do this.'; end if;
  if v_link is not null and (char_length(v_link) > 300 or v_link !~ '^https://[^[:space:]]+$') then raise exception 'Enter a valid link that starts with https://'; end if;
  update public.sessions set meeting_link = v_link where id = p_session_id and mentor_id = auth.uid() and status = 'accepted';
  if not found then raise exception 'Session not found or not accepted.'; end if;
end $$;

create or replace function public.complete_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.sessions%rowtype;
begin
  if public.current_user_role() is distinct from 'mentor' then raise exception 'Only mentors can do this.'; end if;
  select * into v from public.sessions where id = p_session_id and mentor_id = auth.uid() for update;
  if not found then raise exception 'Session not found.'; end if;
  if v.status <> 'accepted' then raise exception 'Only an accepted session can be marked complete.'; end if;
  if v.starts_at > now() then raise exception 'A session can only be marked complete after it has started.'; end if;
  update public.sessions set status = 'completed' where id = v.id;
end $$;

create or replace function public.submit_feedback(p_session_id uuid, p_rating int, p_comment text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v public.sessions%rowtype; v_comment text := btrim(coalesce(p_comment, '')); v_id uuid;
begin
  if public.current_user_role() is distinct from 'student' then raise exception 'Only students can do this.'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Choose a rating from 1 to 5.'; end if;
  if char_length(v_comment) > 500 then raise exception 'The comment must be 500 characters or fewer.'; end if;
  select * into v from public.sessions where id = p_session_id and student_id = auth.uid();
  if not found then raise exception 'Session not found.'; end if;
  if v.status <> 'completed' then raise exception 'You can only rate a completed session.'; end if;
  begin
    insert into public.feedback(session_id, student_id, mentor_id, rating, comment) values (v.id, v.student_id, v.mentor_id, p_rating, v_comment) returning id into v_id;
  exception when unique_violation then raise exception 'Feedback was already submitted for this session.'; end;
  return v_id;
end $$;

create or replace function public.remove_connection(p_connection_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.connections%rowtype;
begin
  if public.current_user_role() is null then raise exception 'Please log in first.'; end if;
  select * into v from public.connections where id = p_connection_id and (student_id = auth.uid() or mentor_id = auth.uid()) for update;
  if not found then raise exception 'Connection not found.'; end if;
  if v.status <> 'accepted' then raise exception 'Only an accepted connection can be removed.'; end if;
  update public.connections set status = 'removed', removed_at = now() where id = v.id;
  with cancelled as ( update public.sessions set status = 'cancelled', responded_at = now() where connection_id = v.id and status in ('pending','accepted') and starts_at > now() returning slot_id )
  update public.availability_slots s set status = 'open' from cancelled c where s.id = c.slot_id and s.status = 'booked' and s.starts_at > now();
end $$;

create or replace function public.report_user(p_user_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_reason text := btrim(coalesce(p_reason, '')); v_id uuid;
begin
  if coalesce(public.current_user_role(), '') not in ('student','mentor') then raise exception 'Not allowed.'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot report yourself.'; end if;
  if char_length(v_reason) = 0 then raise exception 'Please explain why you are reporting this user.'; end if;
  if char_length(v_reason) > 500 then raise exception 'The reason must be 500 characters or fewer.'; end if;
  begin
    insert into public.reports(reporter_id, reported_user_id, reason) values (auth.uid(), p_user_id, v_reason) returning id into v_id;
  exception when unique_violation then raise exception 'You already have an open report about this user.'; end;
  return v_id;
end $$;

create or replace function public.admin_resolve_report(p_report_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_note text := btrim(coalesce(p_note, ''));
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if char_length(v_note) > 500 then raise exception 'The note must be 500 characters or fewer.'; end if;
  update public.reports set status = 'resolved', resolved_by = auth.uid(), resolved_at = now(), resolution_note = v_note where id = p_report_id and status = 'open';
  if not found then raise exception 'Report not found or already resolved.'; end if;
end $$;

create or replace function public.admin_save_category(p_id uuid, p_name text, p_active boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_name, '')); v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'Category names must be 2–60 characters.'; end if;
  begin
    if p_id is null then insert into public.categories(name, is_active) values (v_name, coalesce(p_active, true)) returning id into v_id;
    else update public.categories set name = v_name, is_active = coalesce(p_active, true) where id = p_id returning id into v_id;
      if v_id is null then raise exception 'Category not found.'; end if; end if;
  exception when unique_violation then raise exception 'A category with this name already exists.'; end;
  return v_id;
end $$;

create or replace function public.mentor_reviews(p_mentor_id uuid)
returns table (rating smallint, comment text, created_at timestamptz, student_first_name text)
language sql stable security definer set search_path = public as $$
  select f.rating, f.comment, f.created_at, split_part(p.full_name, ' ', 1)
  from public.feedback f
  join public.profiles p on p.id = f.student_id
  join public.mentor_profiles m on m.id = f.mentor_id and m.approval_status = 'approved'
  join public.profiles mp on mp.id = f.mentor_id and mp.is_active
  where f.mentor_id = p_mentor_id and public.current_user_role() in ('student', 'admin')
  order by f.created_at desc limit 20
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png'];

create policy avatars_select_own on storage.objects for select to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);