

alter table public.mentor_profiles add column if not exists linkedin_url text
  check (linkedin_url is null or linkedin_url ~ '^https://[^[:space:]]+$');

alter table public.mentor_profiles add column if not exists custom_category text;

alter table public.student_profiles add column if not exists custom_field text;

create or replace view public.mentor_directory with (security_invoker = true) as
select
  p.id, p.full_name, m.headline, m.job_title, m.organisation, m.education,
  m.years_experience, m.skills, array_to_string(m.skills, ' ') as skills_text,
  m.bio, m.category_id, c.name as category_name, m.created_at,
  s.avg_rating, coalesce(s.review_count, 0) as review_count, p.avatar_path,
  m.linkedin_url, m.custom_category
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