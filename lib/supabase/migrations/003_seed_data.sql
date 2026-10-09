-- EduPulse 003: reference data only (categories).
-- Demo users cannot be created in plain SQL (they need Supabase Auth); use `npm run seed:demo`.
insert into public.categories(name) values
  ('Software Engineering'), ('UI/UX Design'), ('Data Science'), ('Business')
on conflict (name) do nothing;
