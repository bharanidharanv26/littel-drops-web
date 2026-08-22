-- Little Drops Old Age Home - Core schema
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- Branches
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('founder', 'trustee', 'staff')),
  is_active boolean not null default true,
  is_higher_authority boolean not null default false,
  created_at timestamptz not null default now()
);

-- Elders: one master record only
create table if not exists public.elders (
  id uuid primary key default gen_random_uuid(),
  admission_number text not null unique,
  name text not null,
  age integer not null check (age > 0 and age < 150),
  gender text not null check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  address text not null,
  phone text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  medical_notes text,
  photo_url text,
  admission_branch_id uuid not null references public.branches(id),
  current_branch_id uuid not null references public.branches(id),
  admission_date date not null,
  status text not null check (status in ('active', 'transferred', 'deceased')) default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- Admissions: immutable admission snapshot
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null unique references public.elders(id) on delete restrict,
  admission_branch_id uuid not null references public.branches(id),
  admission_date date not null,
  admission_number text not null,
  created_at timestamptz not null default now()
);

-- Founder-only user creation requests (to be consumed by secure edge function)
create table if not exists public.user_invites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null check (role in ('founder', 'trustee', 'staff')),
  requested_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'processed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Transfers: permanent history
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references public.elders(id) on delete restrict,
  from_branch_id uuid not null references public.branches(id),
  to_branch_id uuid not null references public.branches(id),
  transfer_date date not null,
  reason text,
  transferred_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint transfers_diff_branch_chk check (from_branch_id <> to_branch_id)
);

-- Deaths: permanent history
create table if not exists public.deaths (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null unique references public.elders(id) on delete restrict,
  branch_id uuid not null references public.branches(id),
  death_date date not null,
  remarks text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_elders_current_branch on public.elders(current_branch_id);
create index if not exists idx_elders_admission_branch on public.elders(admission_branch_id);
create index if not exists idx_elders_status on public.elders(status);
create index if not exists idx_transfers_elder_date on public.transfers(elder_id, transfer_date);
create index if not exists idx_deaths_branch_date on public.deaths(branch_id, death_date);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_admissions_branch on public.admissions(admission_branch_id);
create index if not exists idx_user_invites_status on public.user_invites(status);

-- Utility function: current user role
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Enforce immutable admission fields on elders table
create or replace function public.prevent_elder_admission_updates()
returns trigger
language plpgsql
as $$
begin
  if old.admission_date <> new.admission_date
     or old.admission_branch_id <> new.admission_branch_id
     or old.admission_number <> new.admission_number then
    raise exception 'Admission information cannot be changed once created';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_elder_admission_updates on public.elders;
create trigger trg_prevent_elder_admission_updates
before update on public.elders
for each row
execute function public.prevent_elder_admission_updates();

-- Keep admissions table synchronized on elder creation
create or replace function public.sync_admission_from_elder_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.admissions (elder_id, admission_branch_id, admission_date, admission_number)
  values (new.id, new.admission_branch_id, new.admission_date, new.admission_number);
  return new;
end;
$$;

drop trigger if exists trg_sync_admission_from_elder_insert on public.elders;
create trigger trg_sync_admission_from_elder_insert
after insert on public.elders
for each row
execute function public.sync_admission_from_elder_insert();

insert into public.admissions (elder_id, admission_branch_id, admission_date, admission_number)
select e.id, e.admission_branch_id, e.admission_date, e.admission_number
from public.elders e
left join public.admissions a on a.elder_id = e.id
where a.elder_id is null;

-- Atomic transfer operation
create or replace function public.transfer_elder(
  p_elder_id uuid,
  p_to_branch_id uuid,
  p_transfer_date date,
  p_reason text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_from_branch_id uuid;
  v_user_id uuid;
begin
  if public.current_user_role() not in ('founder', 'staff') then
    raise exception 'Permission denied';
  end if;

  v_user_id := auth.uid();

  select current_branch_id
    into v_from_branch_id
  from public.elders
  where id = p_elder_id and status = 'active'
  for update;

  if v_from_branch_id is null then
    raise exception 'Active elder not found';
  end if;

  if v_from_branch_id = p_to_branch_id then
    raise exception 'Destination branch must be different';
  end if;

  insert into public.transfers (elder_id, from_branch_id, to_branch_id, transfer_date, reason, transferred_by)
  values (p_elder_id, v_from_branch_id, p_to_branch_id, p_transfer_date, p_reason, v_user_id);

  update public.elders
  set current_branch_id = p_to_branch_id
  where id = p_elder_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
  values (
    v_user_id,
    'TRANSFER_ELDER',
    'elder',
    p_elder_id,
    jsonb_build_object(
      'from_branch_id', v_from_branch_id,
      'to_branch_id', p_to_branch_id,
      'transfer_date', p_transfer_date,
      'reason', p_reason
    )
  );
end;
$$;

-- Atomic death recording operation
create or replace function public.record_elder_death(
  p_elder_id uuid,
  p_death_date date,
  p_remarks text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_branch_id uuid;
  v_user_id uuid;
begin
  if public.current_user_role() not in ('founder', 'staff') then
    raise exception 'Permission denied';
  end if;

  v_user_id := auth.uid();

  select current_branch_id
    into v_branch_id
  from public.elders
  where id = p_elder_id and status = 'active'
  for update;

  if v_branch_id is null then
    raise exception 'Active elder not found';
  end if;

  insert into public.deaths (elder_id, branch_id, death_date, remarks, recorded_by)
  values (p_elder_id, v_branch_id, p_death_date, p_remarks, v_user_id);

  update public.elders
  set status = 'deceased'
  where id = p_elder_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
  values (
    v_user_id,
    'RECORD_DEATH',
    'elder',
    p_elder_id,
    jsonb_build_object(
      'branch_id', v_branch_id,
      'death_date', p_death_date,
      'remarks', p_remarks
    )
  );
end;
$$;

-- RLS
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.elders enable row level security;
alter table public.admissions enable row level security;
alter table public.transfers enable row level security;
alter table public.deaths enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_invites enable row level security;

-- Branches policies
create policy if not exists branches_read_all on public.branches
for select using (auth.uid() is not null);

create policy if not exists branches_write_founder on public.branches
for all using (public.current_user_role() = 'founder')
with check (public.current_user_role() = 'founder');

-- Profiles policies
create policy if not exists profiles_read_all on public.profiles
for select using (auth.uid() is not null);

create policy if not exists profiles_founder_manage on public.profiles
for all using (public.current_user_role() = 'founder')
with check (public.current_user_role() = 'founder');

-- Elders policies
create policy if not exists elders_read_all on public.elders
for select using (auth.uid() is not null);

create policy if not exists elders_write_founder_staff on public.elders
for insert with check (public.current_user_role() in ('founder', 'staff'));

create policy if not exists elders_update_founder_staff on public.elders
for update using (public.current_user_role() in ('founder', 'staff'))
with check (public.current_user_role() in ('founder', 'staff'));

-- Admissions policies
create policy if not exists admissions_read_all on public.admissions
for select using (auth.uid() is not null);

-- Transfers policies
create policy if not exists transfers_read_all on public.transfers
for select using (auth.uid() is not null);

create policy if not exists transfers_write_founder_staff on public.transfers
for insert with check (public.current_user_role() in ('founder', 'staff'));

-- Deaths policies
create policy if not exists deaths_read_all on public.deaths
for select using (auth.uid() is not null);

create policy if not exists deaths_write_founder_staff on public.deaths
for insert with check (public.current_user_role() in ('founder', 'staff'));

-- Audit policies
create policy if not exists audit_read_founder_trustee on public.audit_logs
for select using (public.current_user_role() in ('founder', 'trustee'));

create policy if not exists audit_write_founder_staff on public.audit_logs
for insert with check (public.current_user_role() in ('founder', 'staff'));

-- Founder-only user invite queue
create policy if not exists user_invites_founder_read on public.user_invites
for select using (public.current_user_role() = 'founder');

create policy if not exists user_invites_founder_write on public.user_invites
for insert with check (public.current_user_role() = 'founder');

create policy if not exists user_invites_founder_update on public.user_invites
for update using (public.current_user_role() = 'founder')
with check (public.current_user_role() = 'founder');
