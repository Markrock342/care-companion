-- Admin console: audit log, aggregated stats, and guarded admin operations.
-- Run after schema.sql and 002_trip_safety.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in (
    'approve_companion', 'reject_companion', 'suspend_user', 'restore_user',
    'change_role', 'cancel_trip'
  )),
  target_user uuid references public.profiles (id) on delete set null,
  target_trip uuid references public.trips (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Foreign keys are not indexed automatically; these three columns drive every read.
create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);
create index if not exists admin_actions_admin_idx on public.admin_actions (admin_id);
create index if not exists admin_actions_target_user_idx on public.admin_actions (target_user);
create index if not exists admin_actions_target_trip_idx on public.admin_actions (target_trip);

alter table public.admin_actions enable row level security;

-- Readable by admins only; rows are written by the security definer functions below.
drop policy if exists admin_actions_read on public.admin_actions;
create policy admin_actions_read on public.admin_actions
  for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Guarded admin operations (each one records an audit row)
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_verification(p_user uuid, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.is_admin() then raise exception 'not_allowed'; end if;
  if p_status not in ('approved', 'rejected', 'pending') then raise exception 'invalid_status'; end if;

  update public.profiles
    set verification_status = p_status,
        verification_note = nullif(p_note, '')
    where id = p_user;
  if not found then raise exception 'user_not_found'; end if;

  insert into public.admin_actions (admin_id, action, target_user, note)
  values (
    v_uid,
    case when p_status = 'approved' then 'approve_companion' else 'reject_companion' end,
    p_user,
    coalesce(p_note, '')
  );
end;
$$;

create or replace function public.admin_set_account_status(p_user uuid, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.is_admin() then raise exception 'not_allowed'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  -- An admin locking themselves out would leave nobody able to undo it.
  if p_user = v_uid then raise exception 'cannot_target_self'; end if;

  update public.profiles set account_status = p_status where id = p_user;
  if not found then raise exception 'user_not_found'; end if;

  insert into public.admin_actions (admin_id, action, target_user, note)
  values (v_uid, case when p_status = 'suspended' then 'suspend_user' else 'restore_user' end, p_user, coalesce(p_note, ''));
end;
$$;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old text;
begin
  if v_uid is null or not public.is_admin() then raise exception 'not_allowed'; end if;
  if p_role not in ('customer', 'companion', 'admin') then raise exception 'invalid_role'; end if;
  if p_user = v_uid then raise exception 'cannot_target_self'; end if;

  select role into v_old from public.profiles where id = p_user;
  if v_old is null then raise exception 'user_not_found'; end if;

  update public.profiles
    set role = p_role,
        verification_status = case
          when p_role = 'companion' and verification_status = 'not_required' then 'pending'
          when p_role <> 'companion' then 'not_required'
          else verification_status
        end
    where id = p_user;

  insert into public.admin_actions (admin_id, action, target_user, note)
  values (v_uid, 'change_role', p_user, format('%s -> %s', v_old, p_role));
end;
$$;

create or replace function public.admin_cancel_trip(p_trip uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.is_admin() then raise exception 'not_allowed'; end if;

  update public.trips set status = 'cancelled', share_token = null
    where id = p_trip and status not in ('completed', 'cancelled');
  if not found then raise exception 'invalid_status'; end if;

  update public.offers set status = 'declined' where trip_id = p_trip and status = 'pending';

  insert into public.admin_actions (admin_id, action, target_trip, note)
  values (v_uid, 'cancel_trip', p_trip, coalesce(p_note, ''));
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard numbers, aggregated in the database instead of shipping every row
-- ---------------------------------------------------------------------------

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'not_allowed'; end if;

  select jsonb_build_object(
    'users', (
      select jsonb_build_object(
        'total', count(*),
        'customers', count(*) filter (where role = 'customer'),
        'companions', count(*) filter (where role = 'companion'),
        'admins', count(*) filter (where role = 'admin'),
        'suspended', count(*) filter (where account_status = 'suspended'),
        'pending_companions', count(*) filter (where role = 'companion' and verification_status = 'pending'),
        'new_7d', count(*) filter (where created_at > now() - interval '7 days')
      ) from public.profiles
    ),
    'trips', (
      select jsonb_build_object(
        'total', count(*),
        'open', count(*) filter (where status = 'open'),
        'matched', count(*) filter (where status = 'matched'),
        'in_progress', count(*) filter (where status = 'in_progress'),
        'completed', count(*) filter (where status = 'completed'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'new_7d', count(*) filter (where created_at > now() - interval '7 days'),
        'compensation_completed', coalesce(sum(offered_compensation) filter (where status = 'completed'), 0),
        'avg_compensation', coalesce(round(avg(offered_compensation)), 0)
      ) from public.trips
    ),
    'reviews', (
      select jsonb_build_object(
        'total', count(*),
        'avg_rating', coalesce(round(avg(rating)::numeric, 2), 0),
        'low_ratings', count(*) filter (where rating <= 2)
      ) from public.reviews
    ),
    'weekly', (
      -- Trips created per week for the last 8 weeks, oldest first.
      select coalesce(jsonb_agg(row_to_json(w) order by w.week_start), '[]'::jsonb)
      from (
        select date_trunc('week', d)::date as week_start,
               (select count(*) from public.trips t
                 where t.created_at >= date_trunc('week', d)
                   and t.created_at < date_trunc('week', d) + interval '7 days') as created,
               (select count(*) from public.trips t
                 where t.status = 'completed'
                   and t.updated_at >= date_trunc('week', d)
                   and t.updated_at < date_trunc('week', d) + interval '7 days') as completed
        from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') d
      ) w
    ),
    'categories', (
      select coalesce(jsonb_agg(row_to_json(c) order by c.total desc), '[]'::jsonb)
      from (select category, count(*) as total from public.trips group by category) c
    ),
    'provinces', (
      select coalesce(jsonb_agg(row_to_json(p) order by p.total desc), '[]'::jsonb)
      from (
        select origin_province as province, count(*) as total
        from public.trips group by origin_province order by count(*) desc limit 5
      ) p
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_set_verification(uuid, text, text) from public, anon;
revoke execute on function public.admin_set_account_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
revoke execute on function public.admin_cancel_trip(uuid, text) from public, anon;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_set_verification(uuid, text, text) to authenticated;
grant execute on function public.admin_set_account_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_cancel_trip(uuid, text) to authenticated;
grant execute on function public.admin_stats() to authenticated;
