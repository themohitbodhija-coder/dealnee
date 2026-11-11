-- Replace the original RPC without leaving an ambiguous PostgREST overload.
drop function public.save_category(text,text,text,uuid,text);
create function public.save_category(
  p_name text, p_description text default '', p_icon text default '',
  p_id uuid default null, p_code text default null,
  p_parent_id uuid default null, p_set_parent boolean default false
) returns public.categories
language plpgsql security definer set search_path = '' as $$
declare target public.categories; result public.categories; parent uuid;
begin
  if not private.has_permission('manage_categories') then
    raise exception 'Category management permission required' using errcode='42501';
  end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120
    or length(coalesce(p_description,'')) > 2000 or length(coalesce(p_icon,'')) > 100 then
    raise exception 'Enter a category name (1–120 characters), description up to 2000 characters and icon up to 100 characters' using errcode='22023';
  end if;
  -- Taxonomy is small. Serialize hierarchy edits/deletions to prevent cycle races.
  lock table public.categories in share row exclusive mode;
  if p_id is not null then
    select * into target from public.categories where id=p_id;
    if not found then raise exception 'Category not found' using errcode='P0002'; end if;
    if p_code is not null then raise exception 'Category code is immutable' using errcode='22023'; end if;
    parent := case when p_set_parent then p_parent_id else target.parent_id end;
    if target.is_system and parent is distinct from target.parent_id then
      raise exception 'Built-in category hierarchy cannot be changed' using errcode='22023';
    end if;
  else
    parent := p_parent_id;
    if p_code is not null and p_code !~ '^[A-Z][A-Z0-9_]{1,63}$' then
      raise exception 'Invalid category code' using errcode='22023';
    end if;
  end if;
  if parent is not null then
    if not exists(select 1 from public.categories where id=parent) then
      raise exception 'Parent category not found' using errcode='22023';
    end if;
    if p_id is not null and exists(
      with recursive ancestors as (
        select id,parent_id from public.categories where id=parent
        union select c.id,c.parent_id from public.categories c join ancestors a on c.id=a.parent_id
      ) select 1 from ancestors where id=p_id
    ) then raise exception 'A category cannot be its own parent or a descendant of itself' using errcode='22023'; end if;
  end if;
  if exists(select 1 from public.categories where lower(name)=lower(btrim(p_name)) and id is distinct from p_id) then
    raise exception 'A category with this name already exists' using errcode='23505';
  end if;
  if p_id is null then
    insert into public.categories(code,name,description,icon,parent_id)
      values(coalesce(p_code,'CUSTOM_' || upper(replace(gen_random_uuid()::text,'-',''))),btrim(p_name),coalesce(p_description,''),coalesce(p_icon,''),parent)
      returning * into result;
  else
    update public.categories set name=btrim(p_name),description=coalesce(p_description,''),icon=coalesce(p_icon,''),parent_id=parent
      where id=p_id returning * into result;
  end if;
  return result;
end;
$$;
create or replace function public.delete_category(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare target public.categories;
begin
  if not private.has_permission('manage_categories') then
    raise exception 'Category management permission required' using errcode='42501';
  end if;
  lock table public.categories in share row exclusive mode;
  select * into target from public.categories where id=p_id for update;
  if not found then raise exception 'Category not found' using errcode='P0002'; end if;
  if target.is_system then raise exception 'Built-in categories cannot be deleted' using errcode='22023'; end if;
  if exists(select 1 from public.categories where parent_id=p_id) then
    raise exception 'Move or delete child categories first' using errcode='23503';
  end if;
  if exists(select 1 from public.properties where category_id=p_id)
    or exists(select 1 from public.property_subtypes where category_id=p_id) then
    raise exception 'This category is in use and cannot be deleted' using errcode='23503';
  end if;
  delete from public.categories where id=p_id;
end;
$$;
revoke all on function public.save_category(text,text,text,uuid,text,uuid,boolean), public.delete_category(uuid) from public,anon;
grant execute on function public.save_category(text,text,text,uuid,text,uuid,boolean), public.delete_category(uuid) to authenticated;
