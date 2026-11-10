create function private.is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.user_access where user_id = auth.uid() and active);
$$;
create function private.has_permission(required_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.user_access a where a.user_id = auth.uid() and a.active
      and (a.role = 'admin' or (a.role = 'subadmin' and exists (
        select 1 from private.user_permissions p
        where p.user_id = a.user_id and p.permission = required_permission
      )))
  );
$$;
grant execute on function private.is_active(), private.has_permission(text) to authenticated;

-- This RPC returns only the caller's identity/capabilities, never auth emails or
-- another user's access record. Live DB reads make revocations immediate.
create function public.current_account() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', a.user_id, 'name', p.name, 'phone', p.phone, 'role', a.role,
    'permissions', case when a.role = 'subadmin' then coalesce((
      select jsonb_agg(up.permission order by up.permission)
        from private.user_permissions up where up.user_id = a.user_id
    ), '[]'::jsonb) else '[]'::jsonb end
  ) from private.user_access a join public.profiles p on p.id = a.user_id
    where a.user_id = auth.uid() and a.active;
$$;
grant execute on function public.current_account() to authenticated;

-- Enable RLS on every application table, including those outside the API schema.
do $$
declare relation regclass;
begin
  for relation in
    select c.oid::regclass from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname in ('public','private') and c.relkind = 'r'
        and c.relname in ('profiles','user_access','user_permissions','categories','property_subtypes',
          'properties','property_details','property_units','property_images','inquiries','wishlists',
          'property_counters','uploads','deletion_jobs','audit_events','rate_limit_buckets','idempotency_requests')
  loop
    execute format('alter table %s enable row level security', relation);
    execute format('revoke all on table %s from public, anon, authenticated', relation);
  end loop;
end;
$$;

grant select on public.profiles to authenticated;
grant update(name, phone) on public.profiles to authenticated;
create policy profile_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) and (select private.is_active()));
create policy profile_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select private.is_active()))
  with check (id = (select auth.uid()) and (select private.is_active()));

grant select on public.categories, public.property_subtypes, public.properties,
  public.property_details, public.property_units, public.property_images to anon, authenticated;
create policy catalog_categories_read on public.categories for select to anon, authenticated using (true);
create policy catalog_subtypes_read on public.property_subtypes for select to anon, authenticated using (true);
-- Committed listings, including sold/rented details, are public. There are no
-- draft rows in this table. Future drafts must live separately or change policies.
create policy catalog_properties_read on public.properties for select to anon, authenticated using (true);
create policy catalog_details_read on public.property_details for select to anon, authenticated
  using (exists(select 1 from public.properties p where p.id = property_details.property_id));
create policy catalog_units_read on public.property_units for select to anon, authenticated
  using (exists(select 1 from public.properties p where p.id = property_units.property_id));
create policy catalog_images_read on public.property_images for select to anon, authenticated
  using (exists(select 1 from public.properties p where p.id = property_images.property_id));

-- Category structure is changed through a constrained RPC, not arbitrary patches.
create function public.save_category(
  p_name text, p_description text default '', p_icon text default '',
  p_id uuid default null, p_code text default null
) returns public.categories
language plpgsql security definer set search_path = '' as $$
declare result public.categories;
begin
  if not private.has_permission('manage_categories') then
    raise exception 'Category management permission required' using errcode = '42501';
  end if;
  if p_id is null then
    insert into public.categories(code, name, description, icon)
      values(p_code, btrim(p_name), coalesce(p_description,''), coalesce(p_icon,'')) returning * into result;
  else
    if p_code is not null then
      raise exception 'Category code is immutable' using errcode = '22023';
    end if;
    update public.categories set name = btrim(p_name), description = coalesce(p_description,''), icon = coalesce(p_icon,'')
      where id = p_id returning * into result;
    if not found then raise exception 'Category not found' using errcode = 'P0002'; end if;
  end if;
  return result;
end;
$$;
create function public.delete_category(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare target public.categories;
begin
  if not private.has_permission('manage_categories') then
    raise exception 'Category management permission required' using errcode = '42501';
  end if;
  select * into target from public.categories where id = p_id for update;
  if not found then raise exception 'Category not found' using errcode = 'P0002'; end if;
  if target.is_system then raise exception 'System categories cannot be deleted' using errcode = '22023'; end if;
  delete from public.categories where id = p_id;
end;
$$;
grant execute on function public.save_category(text,text,text,uuid,text), public.delete_category(uuid) to authenticated;

grant select, delete on public.inquiries to authenticated;
grant update(status) on public.inquiries to authenticated;
create policy inquiry_staff_read on public.inquiries for select to authenticated
  using ((select private.has_permission('view_inquiries')));
create policy inquiry_staff_status on public.inquiries for update to authenticated
  using ((select private.has_permission('view_inquiries')))
  with check ((select private.has_permission('view_inquiries')));
create policy inquiry_staff_delete on public.inquiries for delete to authenticated
  using ((select private.has_permission('view_inquiries')));
create function public.read_inquiry(p_id uuid) returns public.inquiries
language plpgsql security invoker set search_path = '' as $$
declare result public.inquiries;
begin
  if not private.has_permission('view_inquiries') then
    raise exception 'Inquiry permission required' using errcode = '42501';
  end if;
  update public.inquiries set status = 'read' where id = p_id returning * into result;
  if not found then raise exception 'Inquiry not found' using errcode = 'P0002'; end if;
  return result;
end;
$$;
grant execute on function public.read_inquiry(uuid) to authenticated;

grant select, insert, delete on public.wishlists to authenticated;
create policy wishlist_self_read on public.wishlists for select to authenticated
  using (user_id = (select auth.uid()) and (select private.is_active()));
create policy wishlist_self_insert on public.wishlists for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_active()));
create policy wishlist_self_delete on public.wishlists for delete to authenticated
  using (user_id = (select auth.uid()) and (select private.is_active()));

-- Edge Functions use an elevated client only after explicit caller validation.
-- No browser can insert inquiries (including by bypassing the public form).
grant usage on schema public, private to service_role;
grant all on all tables in schema public, private to service_role;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_active(), private.has_permission(text) to authenticated;
grant execute on all functions in schema private to service_role;
