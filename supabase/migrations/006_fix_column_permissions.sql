-- Grant update permissions for newly added columns

grant update (linkedin_url, custom_category) on public.mentor_profiles to authenticated;
grant update (custom_field) on public.student_profiles to authenticated;