-- Explicit public projection: never join auth.users or staff profiles here.
create function private.property_dto(p public.properties) returns jsonb
language sql stable security definer set search_path = '' as $$
select jsonb_build_object(
  '_id',p.id,'id',p.id,'propertyId',p.property_id,'propertyType',p.property_type,
  'category',(select jsonb_build_object('_id',c.id,'name',c.name,'code',c.code) from public.categories c where c.id=p.category_id),
  'subcategory',p.subtype_code,'title',p.title,'description',p.description,
  'price',p.price::text,'area',p.area::text,'areaUnit',p.area_unit,'plotArea',p.plot_area::text,
  'bedrooms',p.bedrooms,'bathrooms',p.bathrooms,'bathroom2',p.bathrooms,
  'location',jsonb_build_object('address',p.address,'city',p.city,'state',p.state,
    'locality',p.locality,'landmark',p.landmark,'latitude',p.latitude,'longitude',p.longitude),
  'contact',jsonb_build_object('phone',p.listing_phone),
  'amenities',p.amenities,'facilities',p.facilities,'furnishingItems',p.furnishing_items,
  'outdoorFeatures',p.outdoor_features,'furnishingStatus',p.furnishing_status,
  'featured',p.featured,'status',p.status,'views',p.views,'version',p.version,
  'createdAt',p.created_at,'updatedAt',p.updated_at,
  'images',coalesce((select jsonb_agg(i.object_key order by i.sort_order) from public.property_images i where i.property_id=p.id),'[]'::jsonb),
  'imageRecords',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'objectKey',i.object_key,'sortOrder',i.sort_order) order by i.sort_order) from public.property_images i where i.property_id=p.id),'[]'::jsonb),
  'resaleInfo',coalesce(d.resale_info,'{}'::jsonb) || case when p.property_type='BUY' then jsonb_build_object('furnishingStatus',p.furnishing_status,'propertyAge',p.property_age) else '{}'::jsonb end,
  'rentalInfo',coalesce(d.rental_info,'{}'::jsonb) || case when p.property_type='RENT' then jsonb_build_object('monthlyRent',p.price::text,'bedrooms',p.bedrooms,'bathrooms',p.bathrooms,'furnishingStatus',p.furnishing_status) else '{}'::jsonb end,
  'commercialDetails',coalesce(d.commercial_details,'{}'::jsonb) || case when p.property_type='COMMERCIAL' then jsonb_build_object('price',p.price::text,'builtUpArea',p.area::text,'furnishingType',p.furnishing_status,'propertyAge',p.property_age) else '{}'::jsonb end,
  'newProjectInfo',coalesce(d.new_project_info,'{}'::jsonb),
  'projectPricing',coalesce(d.project_pricing,'{}'::jsonb) || jsonb_build_object('unitConfigurations',coalesce((
    select jsonb_object_agg(u.unit_code,jsonb_build_object('superBuildUpArea',u.super_built_up_area::text,
      'carpetArea',u.carpet_area::text,'landArea',u.land_area::text,'price',u.price::text))
      from public.property_units u where u.property_id=p.id),'{}'::jsonb))
) from (values(1)) dummy(n) left join public.property_details d on d.property_id=p.id;
$$;

create function public.get_property(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select private.property_dto(p) into result from public.properties p where id=p_id;
  if result is null then raise exception 'Property not found' using errcode='P0002'; end if;
  return jsonb_build_object('success',true,'property',result);
end;
$$;

-- One parameterized filter/count/page implementation for public and staff reads.
-- String position implements literal substring search: %, _ and regex characters
-- never become patterns or executable SQL.
create function public.list_properties(p_filters jsonb default '{}', p_admin boolean default false) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_page integer := 1; v_limit integer := 12; v_type text; v_category uuid;
  v_category_input text; v_code text; v_subtype text; v_subcategory text;
  v_min_price numeric; v_max_price numeric; v_min_area numeric; v_max_area numeric;
  v_bedrooms integer; v_bathrooms integer; v_furnishing text; v_age text;
  v_status text := 'available'; v_q text; v_location text; v_locality text;
  v_featured boolean := false; v_invalid boolean := false; k text; val text; result jsonb;
begin
  if p_filters is null or jsonb_typeof(p_filters)<>'object' or octet_length(p_filters::text)>4096 then
    raise exception 'Invalid catalog filters' using errcode='22023';
  end if;
  if p_admin is null then raise exception 'Invalid catalog mode' using errcode='22023'; end if;
  if p_admin and not private.has_permission('manage_properties') then
    raise exception 'Property management permission required' using errcode='42501';
  end if;
  for k,val in select key,value from jsonb_each_text(p_filters) loop
    if not (k=any(array['page','limit','type','category','subtype','minPrice','maxPrice','location','locality',
      'bedrooms','bathrooms','minArea','maxArea','furnished','propertyAge','q','status','featured']))
      or length(coalesce(val,''))>200 or jsonb_typeof(p_filters->k) not in ('string','number','boolean','null') then
      raise exception 'Invalid catalog filter: %',k using errcode='22023';
    end if;
    if val is null or val='' then continue; end if;
    if k in ('page','limit','bedrooms','bathrooms') and (val !~ '^[0-9]{1,7}$') then
      raise exception 'Invalid integer filter: %',k using errcode='22023';
    end if;
    if k in ('minPrice','maxPrice','minArea','maxArea') and val !~ '^[0-9]{1,14}(\.[0-9]{1,4})?$' then
      raise exception 'Invalid numeric filter: %',k using errcode='22023';
    end if;
  end loop;
  v_page:=coalesce(nullif(p_filters->>'page','')::integer,1);
  v_limit:=coalesce(nullif(p_filters->>'limit','')::integer,12);
  if v_page<1 or v_page>1000000 or v_limit<1 or v_limit>100 then
    raise exception 'Invalid pagination' using errcode='22023';
  end if;
  v_type:=upper(nullif(p_filters->>'type',''));
  if v_type is not null and v_type not in ('BUY','RENT','COMMERCIAL') then
    raise exception 'Invalid property type' using errcode='22023';
  end if;
  if nullif(p_filters->>'status','') is not null then
    if not p_admin then raise exception 'Status filtering requires staff access' using errcode='42501'; end if;
    v_status:=p_filters->>'status';
    if v_status not in ('available','sold','rented','all') then raise exception 'Invalid status' using errcode='22023'; end if;
  elsif p_admin then v_status:='all'; end if;
  v_subtype:=lower(nullif(p_filters->>'subtype',''));
  v_category_input:=nullif(p_filters->>'category','');
  if v_subtype in ('newprojects','new_project') then
    v_code:='NEW_PROJECT';
    if lower(coalesce(v_category_input,'')) in ('apartment','villa','plot') then
      v_subcategory:='NEW_PROJECT_'||upper(v_category_input); v_category_input:=null;
    end if;
  elsif v_subtype='resale' then v_code:='RESALE';
  elsif v_subtype='buy' and v_type='COMMERCIAL' then v_code:='COMMERCIAL_BUY';
  elsif v_subtype='lease' and v_type='COMMERCIAL' then v_code:='COMMERCIAL_LEASE';
  elsif v_subtype is not null then
    select code into v_subcategory from public.property_subtypes where lower(code)=v_subtype;
    if v_subcategory is null then v_invalid:=true; end if;
  end if;
  if v_category_input is not null then
    v_category_input:=case lower(v_category_input)
      when 'buy' then case when v_type='COMMERCIAL' then 'COMMERCIAL_BUY' else 'BUY_PROPERTY' end
      when 'lease' then 'COMMERCIAL_LEASE' when 'commercial buy' then 'COMMERCIAL_BUY'
      when 'commercial lease' then 'COMMERCIAL_LEASE' when 'new projects' then 'NEW_PROJECT'
      when 'newprojects' then 'NEW_PROJECT' when 'residential' then 'RENT'
      when 'rental_property' then 'RENT' when 'rent property' then 'RENT'
      when 'commercial' then 'COMMERCIAL_ROOT' else v_category_input end;
    select id into v_category from public.categories where lower(code)=lower(v_category_input)
      or lower(name)=lower(v_category_input) or id::text=lower(v_category_input);
    if v_category is null then v_invalid:=true; end if;
    if v_code is not null and not exists(select 1 from public.categories where id=v_category and code=v_code) then v_invalid:=true; end if;
  elsif v_code is not null then
    select id into v_category from public.categories where code=v_code;
  end if;
  v_min_price:=nullif(p_filters->>'minPrice','')::numeric; v_max_price:=nullif(p_filters->>'maxPrice','')::numeric;
  v_min_area:=nullif(p_filters->>'minArea','')::numeric; v_max_area:=nullif(p_filters->>'maxArea','')::numeric;
  if v_min_price>v_max_price or v_min_area>v_max_area then raise exception 'Minimum exceeds maximum' using errcode='22023'; end if;
  v_bedrooms:=nullif(p_filters->>'bedrooms','')::integer; v_bathrooms:=nullif(p_filters->>'bathrooms','')::integer;
  if v_bedrooms>100 or v_bathrooms>100 then raise exception 'Invalid room count' using errcode='22023'; end if;
  v_furnishing:=upper(replace(nullif(p_filters->>'furnished',''),'-','_'));
  if v_furnishing='FURNISHED' then v_furnishing:='FULLY_FURNISHED'; end if;
  if v_furnishing not in ('UNFURNISHED','SEMI_FURNISHED','FULLY_FURNISHED') then raise exception 'Invalid furnishing' using errcode='22023'; end if;
  v_age:=nullif(p_filters->>'propertyAge','');
  if v_age not in ('new','recent','moderate','old') then raise exception 'Invalid property age' using errcode='22023'; end if;
  v_q:=lower(nullif(btrim(p_filters->>'q'),''));
  v_location:=lower(nullif(btrim(p_filters->>'location'),'')); v_locality:=lower(nullif(btrim(p_filters->>'locality'),''));
  if p_filters ? 'featured' then
    if p_filters->>'featured' not in ('true','false') then raise exception 'Invalid featured flag' using errcode='22023'; end if;
    v_featured:=coalesce((p_filters->>'featured')::boolean,false);
  end if;
  with matches as materialized (
    select p.* from public.properties p where not v_invalid
      and (v_status='all' or p.status=v_status) and (v_type is null or p.property_type=v_type)
      and (v_category is null or p.category_id=v_category) and (v_subcategory is null or p.subtype_code=v_subcategory)
      and (v_min_price is null or p.price>=v_min_price) and (v_max_price is null or p.price<=v_max_price)
      and (v_min_area is null or p.area>=v_min_area) and (v_max_area is null or p.area<=v_max_area)
      and (v_bedrooms is null or p.bedrooms=v_bedrooms) and (v_bathrooms is null or p.bathrooms=v_bathrooms)
      and (v_furnishing is null or p.furnishing_status=v_furnishing)
      and (v_age is null or case v_age when 'new' then p.property_age<=1 when 'recent' then p.property_age>1 and p.property_age<=5
        when 'moderate' then p.property_age>5 and p.property_age<=10 when 'old' then p.property_age>10 end)
      and (not v_featured or p.featured)
      and (v_location is null or strpos(lower(p.city),v_location)>0 or strpos(lower(p.address),v_location)>0)
      and (v_locality is null or strpos(lower(coalesce(p.locality,'')),v_locality)>0)
      and (v_q is null or strpos(lower(p.title),v_q)>0 or strpos(lower(p.description),v_q)>0
        or strpos(lower(p.city),v_q)>0 or strpos(lower(p.address),v_q)>0)
  ), page_rows as (
    select * from matches order by created_at desc,id desc offset (v_page::bigint-1)*v_limit limit v_limit
  ) select jsonb_build_object('success',true,'total',(select count(*) from matches),'page',v_page,
      'pages',ceil((select count(*) from matches)::numeric/v_limit),
      'properties',coalesce((select jsonb_agg(private.property_dto(p::public.properties) order by p.created_at desc,p.id desc) from page_rows p),'[]'::jsonb)) into result;
  return result;
end;
$$;
create function public.featured_properties() returns jsonb
language sql stable security definer set search_path = '' as $$
  select public.list_properties('{"featured":true,"limit":6}'::jsonb,false);
$$;
create function public.search_properties(p_query text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_query is null or length(btrim(p_query)) not between 1 and 200 then
    raise exception 'Enter a search query of 1 to 200 characters' using errcode='22023';
  end if;
  return public.list_properties(jsonb_build_object('q',p_query,'limit',20),false);
end;
$$;
revoke all on function private.property_dto(public.properties) from public,anon,authenticated;
grant execute on function public.get_property(uuid),public.list_properties(jsonb,boolean),
  public.featured_properties(),public.search_properties(text) to anon,authenticated;
