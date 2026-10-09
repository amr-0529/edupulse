-- EduPulse 001: initial schema (Progress Review scope)
-- Implements the tables needed for FR-01..FR-10 (partial), FR-15.6.
-- NOT created yet (future phase): sessions, feedback, reports.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------- helpers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- categories
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(btrim(name)) between 2 and 60),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('student','mentor','admin')),
  full_name  text not null check (char_length(btrim(full_name)) between 2 and 60),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create table public.student_profiles (
  id             uuid primary key references public.profiles(id) on delete cascade,
  institution    text not null default '' check (char_length(institution) <= 100),
  field_of_study text not null default '' check (char_length(field_of_study) <= 100),
  year_of_study  text not null default '' check (char_length(year_of_study) <= 30),
  interests      text not null default '' check (char_length(interests) <= 200),
  bio            text not null default '' check (char_length(bio) <= 500),
  updated_at     timestamptz not null default now()
);
create trigger student_profiles_touch before update on public.student_profiles
  for each row execute function public.touch_updated_at();

create table public.mentor_profiles (
  id                 uuid primary key references public.profiles(id) on delete cascade,
  headline           text not null default '' check (char_length(headline) <= 120),
  job_title          text not null default '' check (char_length(job_title) <= 100),
  organisation       text not null default '' check (char_length(organisation) <= 100),
  education          text not null default '' check (char_length(education) <= 150),
  years_experience   int  not null default 0 check (years_experience between 0 and 60),
  skills             text[] not null default '{}' check (cardinality(skills) <= 10),
  bio                text not null default '' check (char_length(bio) <= 800),
  category_id        uuid references public.categories(id),
  accepting_students boolean not null default true,
  approval_status    text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  reviewed_by        uuid references public.profiles(id),
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index mentor_profiles_category_idx on public.mentor_profiles(category_id);
create index mentor_profiles_approval_idx on public.mentor_profiles(approval_status);
create trigger mentor_profiles_touch before update on public.mentor_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- connections
create table public.connections (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null constraint connections_student_id_fkey references public.profiles(id) on delete cascade,
  mentor_id     uuid not null constraint connections_mentor_id_fkey  references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted','declined')),
  intro_message text not null default '' check (char_length(intro_message) <= 300),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (student_id <> mentor_id)
);
-- FR-07.2: database-level duplicate prevention
create unique index connections_one_active_per_pair
  on public.connections(student_id, mentor_id) where status in ('pending','accepted');
create index connections_mentor_idx  on public.connections(mentor_id, status);
create index connections_student_idx on public.connections(student_id, status);

-- ---------------------------------------------------------------- messages
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id),
  body          text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index messages_conversation_idx on public.messages(connection_id, created_at desc);

-- ---------------------------------------------------------------- availability
create table public.availability_slots (
  id         uuid primary key default gen_random_uuid(),
  mentor_id  uuid not null references public.profiles(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     text not null default 'open' check (status in ('open','booked','removed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at - starts_at between interval '15 minutes' and interval '120 minutes'),
  -- FR-10.2: no overlapping slots for one mentor
  constraint slots_no_overlap exclude using gist
    (mentor_id with =, tstzrange(starts_at, ends_at) with &&) where (status <> 'removed')
);
create index slots_mentor_idx on public.availability_slots(mentor_id, starts_at);

-- FR-10.1: slot must be in the future (time-dependent, so a trigger, not a CHECK)
create or replace function public.slot_must_be_future()
returns trigger language plpgsql as $$
begin
  if new.starts_at <= now() then
    raise exception 'Slot must start in the future.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger slots_future before insert on public.availability_slots
  for each row execute function public.slot_must_be_future();

-- ---------------------------------------------------------------- new-user trigger (FR-01.1, FR-01.6, FR-02.1)
-- Creates profile rows from signup metadata. Role is limited to student/mentor;
-- 'admin' (or anything else) in metadata is ignored, so admins can never self-register.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'student');
  v_name text := left(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), 60);
begin
  if v_role not in ('student','mentor') then v_role := 'student'; end if;
  if char_length(v_name) < 2 then v_name := 'New user'; end if;

  insert into public.profiles(id, role, full_name) values (new.id, v_role, v_name);
  if v_role = 'student' then
    insert into public.student_profiles(id) values (new.id);
  else
    insert into public.mentor_profiles(id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- discovery view (FR-03.4, FR-04)
-- security_invoker: the caller's RLS applies, so only students/admins can read it.
create view public.mentor_directory with (security_invoker = true) as
select
  p.id, p.full_name, m.headline, m.job_title, m.organisation, m.education,
  m.years_experience, m.skills, array_to_string(m.skills, ' ') as skills_text,
  m.bio, m.category_id, c.name as category_name, m.created_at
from public.mentor_profiles m
join public.profiles   p on p.id = m.id
join public.categories c on c.id = m.category_id
where p.is_active and p.role = 'mentor'
  and m.approval_status = 'approved'
  and m.accepting_students
  and c.is_active
  and btrim(m.headline) <> ''
  and cardinality(m.skills) > 0;
