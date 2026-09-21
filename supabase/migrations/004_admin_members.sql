-- Members directory for admins: profile rows joined with the sign-in data that
-- lives in auth.users, which RLS on public.profiles cannot reach.
-- Run after 003_admin_console.sql. Safe to run again.

create or replace function public.admin_list_users(
  p_role text default null,
  p_state text default null,
  p_search text default null,
  p_limit int default 200
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text,
  verification_status text,
  verification_note text,
  account_status text,
  service_provinces text[],
  experience_years int,
  bio text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  trips_as_customer bigint,
  trips_as_companion bigint,
  avg_rating numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'not_allowed'; end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.role,
    p.verification_status,
    p.verification_note,
    p.account_status,
    p.service_provinces,
    p.experience_years,
    p.bio,
    p.created_at,
    u.last_sign_in_at,
    (select count(*) from public.trips t where t.customer_id = p.id),
    (select count(*) from public.trips t where t.companion_id = p.id),
    (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.reviewee_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where (p_role is null or p_role = '' or p.role = p_role)
    and (
      p_state is null or p_state = ''
      or (p_state = 'suspended' and p.account_status = 'suspended')
      or (p_state <> 'suspended' and p.verification_status = p_state)
    )
    and (
      p_search is null or p_search = ''
      or p.full_name ilike '%' || p_search || '%'
      or u.email ilike '%' || p_search || '%'
      or coalesce(p.phone, '') ilike '%' || p_search || '%'
    )
  order by p.created_at desc
  limit least(coalesce(p_limit, 200), 500);
end;
$$;

revoke execute on function public.admin_list_users(text, text, text, int) from public, anon;
grant execute on function public.admin_list_users(text, text, text, int) to authenticated;
