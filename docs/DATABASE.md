# EduPulse Database

Postgres (Supabase) schema for the EduPulse mentoring platform.

## Applying migrations

In Supabase: *SQL Editor* → open each file in supabase/migrations/ in order and run it.

1. 001_initial_schema.sql — tables, constraints, triggers, discovery view
2. 002_rls_policies.sql — Row Level Security, column grants, RPC functions
3. 003_seed_data.sql — the initial mentor categories
4. 004_more_categories.sql — additional mentor categories

Or with the Supabase CLI: supabase db push.

## Tables

| Table | Purpose |
|---|---|
| categories | Mentor fields (Software Engineering, Data Science, etc.). Used by the discovery filter. |
| profiles | One row per user. Stores role (student / mentor / admin), full name and active flag. |
| student_profiles | Student-specific info (institution, year, interests, bio). |
| mentor_profiles | Mentor-specific info (headline, experience, skills, category, approval status). |
| connections | Student → mentor connection requests and their status (pending / accepted / declined). |
| messages | One row per chat message inside an accepted connection. |
| availability_slots | Mentor-published time slots. |

Plus one view:

| View | Purpose |
|---|---|
| mentor_directory | The public face of an approved mentor. Only shows mentors with approval_status = 'approved', accepting_students = true, an active account, a headline and at least one skill. |

## Key constraints

- profiles.role is one of student, mentor, admin. The public sign-up form can only create student or mentor; the handle_new_user trigger forces the value even if someone tampers with the request.
- connections has a partial unique index on (student_id, mentor_id) where status is pending or accepted, so a student cannot double-request the same mentor.
- availability_slots has an exclusion constraint preventing overlapping slots for the same mentor.
- Column CHECKs cap string lengths and constrain status values everywhere.

## Row Level Security

RLS is enabled on every table. Summary:

| Table | Who can read | Who can write |
|---|---|---|
| categories | Any authenticated user | Nobody from the client |
| profiles | Own row, admins, mentors to students, connected counterparts | Own row (name only) |
| student_profiles | Own row, admins, mentors connected to the student | Own row |
| mentor_profiles | Own row, admins, approved mentors to students | Own row (except approval_status) |
| connections | Participants and admins | Delete on own pending request only. Inserts and status changes happen through RPC functions |
| messages | Participants of the connection | Participants of an accepted connection |
| availability_slots | Mentor, admins, connected students for open future slots | Mentor only |

Sensitive operations (send connection request, respond to request, admin review mentor, admin set active, admin list users) are SECURITY DEFINER functions that re-check the caller's role and ownership inside the function body.