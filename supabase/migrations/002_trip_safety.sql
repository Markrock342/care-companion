-- Trip safety: share-with-family links, last known location, emergency contacts.
-- Run after schema.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.trips add column if not exists share_token uuid unique;
alter table public.trips add column if not exists last_lat double precision;
alter table public.trips add column if not exists last_lng double precision;
alter table public.trips add column if not exists last_located_at timestamptz;

-- Kept out of profiles on purpose: profiles are readable by every signed-in user,
-- but a relative's phone number should only reach people on an active trip.
create table if not exists public.emergency_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default '',
  relation text not null default '',
  phone text not null,
  updated_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;

drop policy if exists emergency_contacts_own on public.emergency_contacts;
create policy emergency_contacts_own on public.emergency_contacts
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Customer turns the family link on (new token) or off (null). Only while the trip is live.
create or replace function public.set_trip_share(p_trip_id uuid, p_enabled boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_token uuid;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'trip_not_found'; end if;
  if v_trip.customer_id <> (select auth.uid()) then raise exception 'not_allowed'; end if;
  if p_enabled and v_trip.status not in ('matched', 'in_progress') then
    raise exception 'invalid_status';
  end if;

  v_token := case when p_enabled then coalesce(v_trip.share_token, gen_random_uuid()) end;
  update public.trips set share_token = v_token where id = p_trip_id;
  return v_token;
end;
$$;

-- Customer or companion posts where they are right now, only during the trip.
create or replace function public.update_trip_location(p_trip_id uuid, p_lat double precision, p_lng double precision)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_uid uuid := (select auth.uid());
  v_now timestamptz := now();
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'trip_not_found'; end if;
  if v_uid is null or v_uid not in (v_trip.customer_id, coalesce(v_trip.companion_id, v_trip.customer_id)) then
    raise exception 'not_allowed';
  end if;
  if v_trip.status <> 'in_progress' then raise exception 'invalid_status'; end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_location';
  end if;

  update public.trips
    set last_lat = p_lat, last_lng = p_lng, last_located_at = v_now
    where id = p_trip_id;
  return v_now;
end;
$$;

-- The customer's emergency contact, for the two people on a live trip.
create or replace function public.get_trip_emergency_contact(p_trip_id uuid)
returns table (name text, relation text, phone text)
language sql
stable
security definer
set search_path = public
as $$
  select c.name, c.relation, c.phone
  from public.trips t
  join public.emergency_contacts c on c.user_id = t.customer_id
  where t.id = p_trip_id
    and t.status in ('matched', 'in_progress')
    and (select auth.uid()) in (t.customer_id, t.companion_id);
$$;

-- What a relative sees through the share link: no login, limited fields, and the link
-- stops working once the trip is cancelled or finished for more than 12 hours.
create or replace function public.get_shared_trip(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'title', t.title,
    'category', t.category,
    'status', t.status,
    'scheduled_date', t.scheduled_date,
    'start_time', t.start_time,
    'duration_hours', t.duration_hours,
    'origin_label', t.origin_label,
    'origin_province', t.origin_province,
    'origin_lat', t.origin_lat,
    'origin_lng', t.origin_lng,
    'destination_label', t.destination_label,
    'destination_province', t.destination_province,
    'destination_lat', t.destination_lat,
    'destination_lng', t.destination_lng,
    'last_lat', t.last_lat,
    'last_lng', t.last_lng,
    'last_located_at', t.last_located_at,
    'updated_at', t.updated_at,
    'customer_name', split_part(cu.full_name, ' ', 1),
    'companion_name', co.full_name,
    'companion_avatar', co.avatar_url,
    'companion_phone', case when t.status in ('matched', 'in_progress') then co.phone end
  )
  from public.trips t
  join public.profiles cu on cu.id = t.customer_id
  left join public.profiles co on co.id = t.companion_id
  where p_token is not null
    and t.share_token = p_token
    and (
      t.status in ('matched', 'in_progress')
      or (t.status = 'completed' and t.updated_at > now() - interval '12 hours')
    );
$$;

revoke execute on function public.set_trip_share(uuid, boolean) from public, anon;
revoke execute on function public.update_trip_location(uuid, double precision, double precision) from public, anon;
revoke execute on function public.get_trip_emergency_contact(uuid) from public, anon;
grant execute on function public.set_trip_share(uuid, boolean) to authenticated;
grant execute on function public.update_trip_location(uuid, double precision, double precision) to authenticated;
grant execute on function public.get_trip_emergency_contact(uuid) to authenticated;
-- The share page is public on purpose; the unguessable token is the credential.
grant execute on function public.get_shared_trip(uuid) to anon, authenticated;
