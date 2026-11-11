-- User-scoped RPC: all authorization and projection happen inside the database.
create function public.get_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor_role text;
  properties_allowed boolean := private.has_permission('manage_properties');
  users_allowed boolean := private.has_permission('manage_users');
  inquiries_allowed boolean := private.has_permission('view_inquiries');
  categories_allowed boolean := private.has_permission('manage_categories');
  stats jsonb := '{}'::jsonb;
  result jsonb;
begin
  select role into actor_role from private.user_access
    where user_id=auth.uid() and active and account_state='ready';
  if actor_role is null or actor_role not in ('admin','subadmin') then
    raise exception 'Staff dashboard access required' using errcode='42501';
  end if;
  result := jsonb_build_object('visibility',jsonb_build_object(
    'properties',properties_allowed,'users',users_allowed,
    'inquiries',inquiries_allowed,'categories',categories_allowed));
  if properties_allowed then
    stats := stats || jsonb_build_object('totalProperties',(select count(*) from public.properties));
    result := result || jsonb_build_object('recentProperties',coalesce((
      select jsonb_agg(row.dto order by row.created_at desc,row.id desc) from (
        select p.id,p.created_at,jsonb_build_object('_id',p.id,'title',p.title,
          'price',p.price::text,'status',p.status,'category',jsonb_build_object('name',c.name)) dto
        from public.properties p join public.categories c on c.id=p.category_id
        order by p.created_at desc,p.id desc limit 5
      ) row
    ),'[]'::jsonb));
  end if;
  if users_allowed then
    -- Match the protected account directory: delegated managers cannot count staff.
    stats := stats || jsonb_build_object('totalUsers',(
      select count(*) from private.user_access where actor_role='admin' or role='user'));
    result := result || jsonb_build_object('userScope',case when actor_role='admin' then 'all' else 'regular' end);
  end if;
  if inquiries_allowed then
    stats := stats || jsonb_build_object('totalInquiries',(select count(*) from public.inquiries),
      'newInquiries',(select count(*) from public.inquiries where status='new'));
    result := result || jsonb_build_object('recentInquiries',coalesce((
      select jsonb_agg(row.dto order by row.created_at desc,row.id desc) from (
        select i.id,i.created_at,jsonb_build_object('_id',i.id,'name',i.name,'email',i.email,
          'status',i.status,'property',case when i.property_title is not null then
            jsonb_build_object('title',i.property_title) else null end) dto
        from public.inquiries i order by i.created_at desc,i.id desc limit 5
      ) row
    ),'[]'::jsonb));
  end if;
  if categories_allowed then
    stats := stats || jsonb_build_object('totalCategories',(select count(*) from public.categories));
  end if;
  return result || jsonb_build_object('stats',stats);
end;
$$;
revoke all on function public.get_dashboard_stats() from public,anon;
grant execute on function public.get_dashboard_stats() to authenticated;
