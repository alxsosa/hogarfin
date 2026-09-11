-- 0001_profiles_households.sql
-- Profiles, households, household_members, household_invitations
-- + shared helpers (updated_at trigger, is_household_member RLS helper)
-- + trigger to auto-create a profile on auth.users insert.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- Shared helper: updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'es-MX',
  default_currency char(3) not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on new auth.users row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- ============================================================================
-- households
-- ============================================================================
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency char(3) not null default 'MXN',
  timezone text not null default 'America/Mexico_City',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_households_updated_at on public.households;
create trigger trg_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- ============================================================================
-- household_members
-- ============================================================================
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER','ADMIN','MEMBER','VIEWER')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index if not exists idx_household_members_household_id on public.household_members(household_id);
create index if not exists idx_household_members_user_id on public.household_members(user_id);

drop trigger if exists trg_household_members_updated_at on public.household_members;
create trigger trg_household_members_updated_at
  before update on public.household_members
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS helper: is_household_member(household_id, min_role)
-- SECURITY DEFINER to avoid recursive RLS lookups on household_members
-- itself. Role hierarchy: OWNER(4) > ADMIN(3) > MEMBER(2) > VIEWER(1).
-- ============================================================================
create or replace function public.is_household_member(
  p_household_id uuid,
  min_role text default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and (
        case upper(hm.role)
          when 'OWNER' then 4
          when 'ADMIN' then 3
          when 'MEMBER' then 2
          when 'VIEWER' then 1
          else 0
        end
      ) >= (
        case upper(min_role)
          when 'OWNER' then 4
          when 'ADMIN' then 3
          when 'MEMBER' then 2
          when 'VIEWER' then 1
          else 1
        end
      )
  );
$$;

comment on function public.is_household_member(uuid, text) is
  'SECURITY DEFINER helper used by RLS policies across all household-scoped tables. Avoids recursive RLS on household_members.';

alter table public.households enable row level security;

drop policy if exists "households_select" on public.households;
create policy "households_select" on public.households
  for select using (public.is_household_member(id, 'viewer'));

drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households
  for insert with check (created_by = auth.uid());

drop policy if exists "households_update" on public.households;
create policy "households_update" on public.households
  for update using (public.is_household_member(id, 'admin'));

drop policy if exists "households_delete" on public.households;
create policy "households_delete" on public.households
  for delete using (public.is_household_member(id, 'owner'));

-- Auto-add creator as OWNER member when a household is created.
create or replace function public.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.household_members (household_id, user_id, role, invited_by)
    values (new.id, new.created_by, 'OWNER', new.created_by)
    on conflict (household_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_household_created on public.households;
create trigger on_household_created
  after insert on public.households
  for each row execute function public.handle_new_household();

alter table public.household_members enable row level security;

drop policy if exists "household_members_select" on public.household_members;
create policy "household_members_select" on public.household_members
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "household_members_insert" on public.household_members;
create policy "household_members_insert" on public.household_members
  for insert with check (public.is_household_member(household_id, 'admin'));

drop policy if exists "household_members_update" on public.household_members;
create policy "household_members_update" on public.household_members
  for update using (public.is_household_member(household_id, 'admin'));

drop policy if exists "household_members_delete" on public.household_members;
create policy "household_members_delete" on public.household_members
  for delete using (
    public.is_household_member(household_id, 'admin')
    or user_id = auth.uid()
  );

-- ============================================================================
-- household_invitations
-- ============================================================================
create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  role text not null default 'MEMBER' check (role in ('ADMIN','MEMBER','VIEWER')),
  token text not null default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','EXPIRED','REVOKED')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token)
);

create index if not exists idx_household_invitations_household_id on public.household_invitations(household_id);
create index if not exists idx_household_invitations_email on public.household_invitations(email);
create unique index if not exists uq_household_invitations_pending
  on public.household_invitations(household_id, email)
  where status = 'PENDING';

drop trigger if exists trg_household_invitations_updated_at on public.household_invitations;
create trigger trg_household_invitations_updated_at
  before update on public.household_invitations
  for each row execute function public.set_updated_at();

alter table public.household_invitations enable row level security;

drop policy if exists "household_invitations_select" on public.household_invitations;
create policy "household_invitations_select" on public.household_invitations
  for select using (public.is_household_member(household_id, 'viewer'));

drop policy if exists "household_invitations_insert" on public.household_invitations;
create policy "household_invitations_insert" on public.household_invitations
  for insert with check (public.is_household_member(household_id, 'admin'));

drop policy if exists "household_invitations_update" on public.household_invitations;
create policy "household_invitations_update" on public.household_invitations
  for update using (public.is_household_member(household_id, 'admin'));

drop policy if exists "household_invitations_delete" on public.household_invitations;
create policy "household_invitations_delete" on public.household_invitations
  for delete using (public.is_household_member(household_id, 'admin'));
