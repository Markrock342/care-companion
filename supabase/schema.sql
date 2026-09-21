-- Care Companion — run this in the Supabase SQL editor (once).
-- Enables Google-auth users, trips, offers, chat, reviews, storage, and RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'companion', 'admin')),
  full_name text not null default '',
  phone text,
  avatar_url text,
  locale text not null default 'th' check (locale in ('th', 'en')),
  bio text,
  experience_years integer,
  skills text[] not null default '{}',
  service_provinces text[] not null default '{}',
  available_days text[] not null default '{}',
  available_from time,
  available_to time,
  min_compensation numeric(10, 2),
  verification_status text not null default 'not_required'
    check (verification_status in ('not_required', 'pending', 'approved', 'rejected')),
  verification_note text,
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  companion_id uuid references public.profiles (id) on delete set null,
  category text not null
    check (category in ('hospital', 'doctor', 'bank', 'government', 'shopping', 'other')),
  title text not null,
  details text not null default '',
  origin_label text not null,
  origin_lat double precision,
  origin_lng double precision,
  origin_province text not null,
  destination_label text not null,
  destination_lat double precision,
  destination_lng double precision,
  destination_province text not null,
  scheduled_date date not null,
  start_time time not null,
  duration_hours numeric(4, 1) not null default 2,
  offered_compensation numeric(10, 2) not null default 0,
  status text not null default 'open'
    check (status in ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  companion_id uuid not null references public.profiles (id) on delete cascade,
  initiated_by text not null check (initiated_by in ('customer', 'companion')),
  message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (trip_id, companion_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (trip_id, reviewer_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists profiles_role_verif_idx
  on public.profiles (role, verification_status);
create index if not exists profiles_service_provinces_idx
  on public.profiles using gin (service_provinces);
create index if not exists trips_customer_idx on public.trips (customer_id);
create index if not exists trips_companion_idx on public.trips (companion_id);
create index if not exists trips_status_date_idx on public.trips (status, scheduled_date);
create index if not exists trips_origin_province_idx on public.trips (origin_province);
create index if not exists offers_trip_idx on public.offers (trip_id);
create index if not exists offers_companion_idx on public.offers (companion_id);
create index if not exists messages_trip_created_idx on public.messages (trip_id, created_at);
create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch
  before update on public.trips
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'admin' then
      new.role := 'customer';
    end if;
    if new.role = 'companion' then
      new.verification_status := 'pending';
    else
      new.verification_status := 'not_required';
    end if;
    new.account_status := 'active';
  elsif tg_op = 'UPDATE' then
    -- auth.uid() is null in the SQL editor, so dashboard promote-to-admin still works.
    if auth.uid() is not null and not public.is_admin() then
      if new.role is distinct from old.role then
        new.role := old.role;
      end if;
      if new.verification_status is distinct from old.verification_status then
        new.verification_status := old.verification_status;
      end if;
      if new.account_status is distinct from old.account_status then
        new.account_status := old.account_status;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before insert or update on public.profiles
  for each row execute function public.protect_profile();

-- ---------------------------------------------------------------------------
-- Domain RPCs
-- ---------------------------------------------------------------------------

create or replace function public.accept_offer(p_offer_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers%rowtype;
  v_trip public.trips%rowtype;
  v_uid uuid := (select auth.uid());
begin
  select * into v_offer from public.offers where id = p_offer_id;
  if not found then
    raise exception 'offer_not_found';
  end if;

  select * into v_trip from public.trips where id = v_offer.trip_id;
  if v_trip.status <> 'open' then
    raise exception 'trip_not_open';
  end if;

  if v_offer.initiated_by = 'customer' and v_offer.companion_id <> v_uid and not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  if v_offer.initiated_by = 'companion' and v_trip.customer_id <> v_uid and not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.offers
    set status = 'accepted'
    where id = p_offer_id;

  update public.offers
    set status = 'declined'
    where trip_id = v_trip.id
      and id <> p_offer_id
      and status = 'pending';

  update public.trips
    set status = 'matched',
        companion_id = v_offer.companion_id
    where id = v_trip.id
    returning * into v_trip;

  return v_trip;
end;
$$;

create or replace function public.start_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_uid uuid := (select auth.uid());
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'trip_not_found'; end if;
  if v_trip.status <> 'matched' then raise exception 'invalid_status'; end if;
  if v_trip.companion_id <> v_uid and not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.trips
    set status = 'in_progress'
    where id = p_trip_id
    returning * into v_trip;
  return v_trip;
end;
$$;

create or replace function public.complete_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_uid uuid := (select auth.uid());
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'trip_not_found'; end if;
  if v_trip.status not in ('matched', 'in_progress') then
    raise exception 'invalid_status';
  end if;
  if v_uid not in (v_trip.customer_id, v_trip.companion_id) and not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.trips
    set status = 'completed'
    where id = p_trip_id
    returning * into v_trip;
  return v_trip;
end;
$$;

create or replace function public.cancel_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_uid uuid := (select auth.uid());
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'trip_not_found'; end if;
  if v_trip.status in ('completed', 'cancelled') then
    raise exception 'invalid_status';
  end if;
  if v_trip.customer_id <> v_uid and not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.trips
    set status = 'cancelled'
    where id = p_trip_id
    returning * into v_trip;

  update public.offers
    set status = 'declined'
    where trip_id = p_trip_id
      and status = 'pending';

  return v_trip;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (
    account_status = 'active'
    or id = (select auth.uid())
    or public.is_admin()
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role in ('customer', 'companion')
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select
  using (
    public.is_admin()
    or customer_id = (select auth.uid())
    or companion_id = (select auth.uid())
    or status = 'open'
  );

drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips
  for insert
  to authenticated
  with check (customer_id = (select auth.uid()));

drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips
  for update
  to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin())
  with check (customer_id = (select auth.uid()) or public.is_admin());

drop policy if exists offers_select on public.offers;
create policy offers_select on public.offers
  for select
  using (
    public.is_admin()
    or companion_id = (select auth.uid())
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.customer_id = (select auth.uid())
    )
  );

drop policy if exists offers_insert on public.offers;
create policy offers_insert on public.offers
  for insert
  to authenticated
  with check (
    companion_id = (select auth.uid())
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.customer_id = (select auth.uid())
    )
  );

drop policy if exists offers_update on public.offers;
create policy offers_update on public.offers
  for update
  to authenticated
  using (
    companion_id = (select auth.uid())
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.customer_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.customer_id = (select auth.uid()) or t.companion_id = (select auth.uid()))
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and t.status in ('matched', 'in_progress', 'completed')
        and (t.customer_id = (select auth.uid()) or t.companion_id = (select auth.uid()))
    )
  );

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select
  using (true);

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and t.status = 'completed'
        and (t.customer_id = (select auth.uid()) or t.companion_id = (select auth.uid()))
        and (reviewee_id = t.customer_id or reviewee_id = t.companion_id)
        and reviewee_id <> (select auth.uid())
    )
  );

-- Functions are executable by PUBLIC (incl. anon) by default. With auth.uid() null,
-- the `<> v_uid` checks evaluate to null and would be skipped, so lock RPCs to signed-in users.
revoke execute on function public.accept_offer(uuid) from public, anon;
revoke execute on function public.start_trip(uuid) from public, anon;
revoke execute on function public.complete_trip(uuid) from public, anon;
revoke execute on function public.cancel_trip(uuid) from public, anon;
grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.start_trip(uuid) to authenticated;
grant execute on function public.complete_trip(uuid) to authenticated;
grant execute on function public.cancel_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_own_write on storage.objects;
create policy avatars_own_write
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- Realtime (chat)
-- ---------------------------------------------------------------------------

alter table public.messages replica identity default;
do $$
begin
  execute 'alter publication supabase_realtime add table public.messages';
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Promote yourself to admin AFTER first Google login:
--   update public.profiles
--     set role = 'admin', verification_status = 'not_required'
--     where id = (select id from auth.users where email = 'you@gmail.com');
-- ---------------------------------------------------------------------------
