-- Seed data for Little Drops Old Age Home
-- Inserts the 8 initial branches per the master project document

insert into public.branches (id, name, location, is_active, created_at)
values
  (gen_random_uuid(), 'Paraniputhur', 'Kalluri Salai, Koluthuvanchery, Paraniputhur, Chennai', true, now()),
  (gen_random_uuid(), 'Gerugambakkam', 'Gerugambakkam, Chennai', true, now()),
  (gen_random_uuid(), 'Somangalam', 'Somangalam', true, now()),
  (gen_random_uuid(), 'Sriperumbudur', 'Sriperumbudur', true, now()),
  (gen_random_uuid(), 'Bengaluru', 'Bengaluru', true, now()),
  (gen_random_uuid(), 'Morappur', 'Morappur', true, now()),
  (gen_random_uuid(), 'Arcot', 'Arcot', true, now()),
  (gen_random_uuid(), 'Batlagundu', 'Batlagundu', true, now())
on conflict (name) do nothing;

-- Quick verification select
select id, name, is_active, created_at from public.branches order by name;

-- Notes:
-- - Run this after applying supabase/schema.sql in your Supabase project.
-- - Creating `auth.users` accounts (Founder/Trustees/Staff) should be done via Supabase Auth
--   or via secure server-side routines; profiles depend on auth.users records.
